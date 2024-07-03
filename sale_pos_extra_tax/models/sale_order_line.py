# -*- coding: utf-8 -*-
from odoo import api, models
from collections import defaultdict


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    @api.depends('product_id', 'company_id', 'order_partner_id')
    def _compute_tax_id(self):
        lines_has_extra_tax = self.filtered(
            lambda line: line.order_partner_id.has_extra_tax and line.product_id.is_extra_tax and line.product_id.extra_tax_id)
        lines_by_company = defaultdict(lambda: self.env['sale.order.line'])
        for line in lines_has_extra_tax:
            lines_by_company[line.company_id] += line
        for company, lines in lines_by_company.items():
            for line in lines.with_company(company):
                taxes = line.product_id.taxes_id._filter_taxes_by_company(company) | line.product_id.extra_tax_id
                fiscal_position = line.order_id.fiscal_position_id
                line.tax_id = fiscal_position.map_tax(taxes)
        return super(SaleOrderLine, self-lines_has_extra_tax)._compute_tax_id()
