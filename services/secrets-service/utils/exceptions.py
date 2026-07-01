from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {"error": response.data, "status_code": response.status_code}
    return response


class PlanLimitExceeded(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Billing plan limit exceeded. Please upgrade your plan."
    default_code = "payment_required"
