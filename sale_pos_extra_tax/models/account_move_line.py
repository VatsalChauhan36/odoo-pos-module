# -*- coding: utf-8 -*-
from odoo import models, api


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    @api.depends('product_id', 'product_uom_id', 'move_id.partner_id')
    def _compute_tax_ids(self):
        super()._compute_tax_ids()

    def _get_computed_taxes(self):
        res = super()._get_computed_taxes()
        if self.move_id.is_sale_document(include_receipts=True) and self.move_id.partner_id.has_extra_tax and self.product_id.is_extra_tax:
            company = self.company_id
            tax_ids = res | self.move_id.fiscal_position_id.map_tax(self.with_company(company).product_id.extra_tax_id)
            return tax_ids
        else:
            return res
