# -*- coding: utf-8 -*-
from odoo import fields, models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    has_extra_tax = fields.Boolean("Extra tax [Reseller]")
