{
    'name': 'Reseller Extra Tax(Sales and POS)',
    'version': '1.0',
    'category': 'Sales/Sales',
    'summary': 'Reseller Extra Tax',
    'description': """ This module provides additional functionality to manage the sales and point of sale extra tax for reseller""",
    'depends': ['sale_management', 'point_of_sale',],
    'data': [
        'views/product_template_views.xml',
        'views/res_partner_views.xml',
    ],
    'installable': True,
    'assets': {
        'point_of_sale._assets_pos': [
            'sale_pos_extra_tax/static/src/**/*',
        ],
    },
    'license': 'LGPL-3',
}
