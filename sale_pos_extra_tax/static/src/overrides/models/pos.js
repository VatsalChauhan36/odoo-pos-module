/** @odoo-module */

import { Product } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Product.prototype, {
    // Set the current tax to another property 'curr_taxes_id'.
    setup(defaultObj) {
        this.curr_taxes_id = defaultObj.taxes_id;
        super.setup(...arguments);
    },
    // Getter for determining if the product has an extra tax.
    get has_extra_tax() {
        const order = this.pos?.get_order();
        if (!order) { return false; }
        const partner = order.get_partner();
        return partner && partner.has_extra_tax && this.is_extra_tax && this.extra_tax_id;
    },
    // Getter for 'taxes_id' considering condition-based taxes.
    get taxes_id() {
        if (this.has_extra_tax) {
            return [...this.curr_taxes_id, this.extra_tax_id[0]];
        } else {
            return this.curr_taxes_id;
        }
    },
    // Setter for 'taxes_id' to update 'curr_taxes_id'.
    set taxes_id(taxes_id) {
        this.curr_taxes_id = taxes_id;
    }
});
