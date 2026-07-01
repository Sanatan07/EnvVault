from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
    CustomTokenObtainPairSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer


class InternalValidateTokenView(APIView):
    """Used by other services to validate a JWT and get user info."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings

        internal_token = request.headers.get("X-Internal-Token")
        if internal_token != settings.INTERNAL_SERVICE_TOKEN:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        token_str = request.data.get("token")
        if not token_str:
            return Response({"detail": "token required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(token_str)
            user = User.objects.get(id=token["user_id"])
            data = UserSerializer(user).data
            from organisations.models import Member
            membership = Member.objects.filter(user=user).first()
            if membership:
                data["org_id"] = str(membership.organisation_id)
                data["role"] = membership.role
            return Response(data)
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_401_UNAUTHORIZED)
