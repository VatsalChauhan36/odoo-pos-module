# -*- coding: utf-8 -*-
from odoo import models


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    def _get_computed_taxes(self):
        company = self.company_id
        company_domain = self.env['account.tax']._check_company_domain(company)
        if self.move_id.is_sale_document(include_receipts=True) and self.move_id.partner_id.has_extra_tax and self.product_id.is_extra_tax:
            filtered_taxes_id = self.product_id.taxes_id.filtered_domain(company_domain) | self.product_id.extra_tax_id
            tax_ids = filtered_taxes_id or self.account_id.tax_ids.filtered(lambda tax: tax.type_tax_use == 'sale')
            if self.company_id and tax_ids:
                tax_ids = tax_ids._filter_taxes_by_company(self.company_id)
            if tax_ids and self.move_id.fiscal_position_id:
                tax_ids = self.move_id.fiscal_position_id.map_tax(tax_ids)
            return tax_ids
        else:
            return super()._get_computed_taxes()
