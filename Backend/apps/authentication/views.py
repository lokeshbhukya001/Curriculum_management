from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

from django.contrib.auth import authenticate

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        institute_name = request.data.get('institute_name')
        
        print("\n" + "="*60)
        print("DIAGNOSTIC LOGIN LOGGER:")
        print(f"  • Username: {username}")
        print(f"  • Password Length: {len(password) if password else 0}")
        print(f"  • Institute Name: {institute_name}")
        
        # Test manual authenticate
        user = authenticate(username=username, password=password)
        if user:
            print(f"  • Manual Authenticate: SUCCESS (User role: {user.role}, Active: {user.is_active})")
        else:
            print("  • Manual Authenticate: FAILED")
            try:
                db_user = User.objects.get(username=username)
                print(f"  • User exists in DB: YES (Role: {db_user.role}, Is Active: {db_user.is_active})")
                print(f"  • DB Hashed Password: {db_user.password}")
            except User.DoesNotExist:
                print("  • User exists in DB: NO")
        print("="*60 + "\n")
        
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data['username'])
            
            # Verify institute if provided (with mapping support for full names vs abbreviations)
            if institute_name and user.institute:
                # Map full display names from the frontend to database codes
                mapping = {
                    'cmr college of engineering & technology': 'cmrcet',
                    'cmr engineering college': 'cmrec',
                    'cmr technical campus': 'cmrtc',
                    'cmr institute of technology': 'cmrit'
                }
                user_inst_name = user.institute.name.lower()
                req_inst_name = institute_name.lower()
                
                # Resolve mapped codes
                mapped_user = mapping.get(user_inst_name, user_inst_name)
                mapped_req = mapping.get(req_inst_name, req_inst_name)
                
                if mapped_user != mapped_req:
                    return Response(
                        {'detail': f'User does not belong to {institute_name}'}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )

            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'institute': {
                    'id': user.institute.id if user.institute else None,
                    'name': user.institute.name if user.institute else None,
                    'subdomain': user.institute.subdomain if user.institute else None,
                }
            }
        return response

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_204_NO_CONTENT)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Frontend URL for password reset
        reset_url = f"http://localhost:5173/reset-password?uid={uid}&token={token}"
        
        subject = "Password Reset Requested"
        message = f"Hello {user.username},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n{reset_url}\n\nIf you did not request this, please ignore this email."
        
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'webmaster@localhost'),
            [email],
            fail_silently=False,
        )
        
        return Response({"detail": "Password reset link has been sent to your email."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid token or user ID."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(password)
        user.save()
        
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
