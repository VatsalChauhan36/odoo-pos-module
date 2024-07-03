# -*- coding: utf-8 -*-
from odoo import fields, models


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    is_extra_tax = fields.Boolean(string='Is Extra Tax')
    extra_tax_id = fields.Many2one(
        "account.tax", string="Select Tax", domain=[('type_tax_use', '=', 'sale')], company_dependent=True)
