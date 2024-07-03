# -*- coding: utf-8 -*-
from odoo import models


class PosSession(models.Model):

    _inherit = 'pos.session'

    def _loader_params_res_partner(self):
        result = super()._loader_params_res_partner()
        result['search_params']['fields'].append('has_extra_tax')
        return result

    def _loader_params_product_product(self):
        result = super()._loader_params_product_product()
        result['search_params']['fields'].extend(['is_extra_tax', 'extra_tax_id'])
        return result
