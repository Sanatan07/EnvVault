from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "limit"
    max_page_size = 1000
