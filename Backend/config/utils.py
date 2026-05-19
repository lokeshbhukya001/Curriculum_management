from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard error response
    response = exception_handler(exc, context)

    # If the database raised ObjectDoesNotExist (like User.DoesNotExist when a token is stale)
    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {"detail": "User matching query does not exist. Please log in again."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    return response
