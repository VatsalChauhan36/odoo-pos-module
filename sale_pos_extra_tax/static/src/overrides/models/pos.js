/** @odoo-module */

import { Orderline, Order, Product } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype, {
    get_total_for_taxes(tax_id) {
        if (this.get_partner() && this.get_partner().has_extra_tax) {
            var total = 0;
            if (!(tax_id instanceof Array)) {
                tax_id = [tax_id];
            }
            var tax_set = {};

            for (var i = 0; i < tax_id.length; i++) {
                tax_set[tax_id[i]] = true;
            }

            this.orderlines.forEach((line) => {
                var product = line.get_product()
                var taxes_ids = this.tax_ids || (product.has_extra_tax ? product.taxes_with_extra_tax : product.taxes_id ) ;
                for (var i = 0; i < taxes_ids.length; i++) {
                    if (tax_set[taxes_ids[i]]) {
                        total += line.get_price_with_tax();
                        return;
                    }
                }
            });

            return total;
        }
        return super.get_total_for_taxes(...arguments)
    }
});

patch(Orderline.prototype, {
    get_display_price_one() {
        var product = this.get_product();
        if (product.has_extra_tax) {
            var rounding = this.pos.currency.rounding;
            var price_unit = this.get_unit_price();
            if (this.pos.config.iface_tax_included !== "total") {
                return round_pr(price_unit * (1.0 - this.get_discount() / 100.0), rounding);
            } else {
                var taxes_ids = this.tax_ids || product.taxes_with_extra_tax;
                var product_taxes = this.pos.get_taxes_after_fp(taxes_ids, this.order.fiscal_position);
                var all_taxes = this.compute_all(
                    product_taxes,
                    price_unit,
                    1,
                    this.pos.currency.rounding
                );

                return round_pr(all_taxes.total_included * (1 - this.get_discount() / 100), rounding);
            }
        } else {
            return super.get_display_price_one(...arguments);
        }
    },
    get_taxed_lst_unit_price() {
        const product = this.get_product();
        if (product.has_extra_tax) {
            const lstPrice = this.compute_fixed_price(this.get_lst_price());
            const taxesIds = product.taxes_with_extra_tax;
            const productTaxes = this.pos.get_taxes_after_fp(taxesIds, this.order.fiscal_position);
            const unitPrices = this.compute_all(productTaxes, lstPrice, 1, this.pos.currency.rounding);
            if (this.pos.config.iface_tax_included === "total") {
                return unitPrices.total_included;
            } else {
                return unitPrices.total_excluded;
            }
        }
        return super.get_taxed_lst_unit_price(...arguments)
    },
    get_applicable_taxes() {
        if (this.get_product().has_extra_tax) {
            var i;
            var ptaxes_ids = this.tax_ids || this.get_product().taxes_with_extra_tax;
            var ptaxes_set = {};
            for (i = 0; i < ptaxes_ids.length; i++) {
                ptaxes_set[ptaxes_ids[i]] = true;
            }
            var taxes = [];
            for (i = 0; i < this.pos.taxes.length; i++) {
                if (ptaxes_set[this.pos.taxes[i].id]) {
                    taxes.push(this.pos.taxes[i]);
                }
            }
            return taxes;
        }
        return super.get_applicable_taxes(...arguments)
    },
    get_taxes() {
        if (this.get_product().has_extra_tax) {
            var taxes_ids = this.tax_ids || this.get_product().taxes_with_extra_tax;
            return this.pos.getTaxesByIds(taxes_ids);
        }
        return super.get_taxes(...arguments);
    },
    _getProductTaxesAfterFiscalPosition() {
        const product = this.get_product();
        if (product.has_extra_tax) {
            let taxesIds = this.tax_ids || product.taxes_with_extra_tax;
            taxesIds = taxesIds.filter((t) => t in this.pos.taxes_by_id);
            return this.pos.get_taxes_after_fp(taxesIds, this.order.fiscal_position);
        }
        return super._getProductTaxesAfterFiscalPosition(...arguments)
    },
    get_all_prices(qty = this.get_quantity()) {
        var product = this.get_product();
        if (product.has_extra_tax) {
            var taxes_ids = this.tax_ids || product.taxes_with_extra_tax;
            taxes_ids = taxes_ids.filter((t) => t in this.pos.taxes_by_id);
            var price_unit = this.get_unit_price() * (1.0 - this.get_discount() / 100.0);
            var product_taxes = this.pos.get_taxes_after_fp(taxes_ids, this.order.fiscal_position);
            var taxtotal = 0;

            var taxdetail = {};

            var all_taxes = this.compute_all(
                product_taxes,
                price_unit,
                qty,
                this.pos.currency.rounding
            );
            var all_taxes_before_discount = this.compute_all(
                product_taxes,
                this.get_unit_price(),
                qty,
                this.pos.currency.rounding
            );
            all_taxes.taxes.forEach(function (tax) {
                taxtotal += tax.amount;
                taxdetail[tax.id] = {
                    amount: tax.amount,
                    base: tax.base,
                };
            });
            return {
                priceWithTax: all_taxes.total_included,
                priceWithoutTax: all_taxes.total_excluded,
                priceWithTaxBeforeDiscount: all_taxes_before_discount.total_included,
                priceWithoutTaxBeforeDiscount: all_taxes_before_discount.total_excluded,
                tax: taxtotal,
                taxDetails: taxdetail,
            };
        } else {
            return super.get_all_prices(...arguments)
        }

    }
});

patch(Product.prototype, {
    get has_extra_tax() {
        const order = this.pos.get_order();
        if (!order){ return false};
        const partner = order.get_partner();
        return partner && partner.has_extra_tax && this.is_extra_tax && this.extra_tax_id
    },
    get taxes_with_extra_tax() {
        if (this.has_extra_tax) {
            return [...this.taxes_id, this.extra_tax_id[0]]
        } else {
            false
        }
    },
    get_display_price({
        pricelist = this.pos.getDefaultPricelist(),
        quantity = 1,
        price = this.get_price(pricelist, quantity),
        iface_tax_included = this.pos.config.iface_tax_included,
    } = {}) {
        if (this.has_extra_tax) {
            const order = this.pos.get_order();
            const taxes = this.pos.get_taxes_after_fp(this.taxes_with_extra_tax, order && order.fiscal_position);
            const currentTaxes = this.pos.getTaxesByIds(this.taxes_with_extra_tax);
            const priceAfterFp = this.pos.computePriceAfterFp(price, currentTaxes);
            const allPrices = this.pos.compute_all(taxes, priceAfterFp, 1, this.pos.currency.rounding);
            if (iface_tax_included === "total") {
                return allPrices.total_included;
            } else {
                return allPrices.total_excluded;
            }
        } else {
            return super.get_display_price(...arguments)
        }
    }
});