import os
import django

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_fresh_credentials():
    print("=" * 50)
    print("Creating Fresh CMS User Credentials in MySQL")
    print("=" * 50)
    
    # 1. Admin Superuser
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@cms.local',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='admin',
        )
        print("[SUCCESS] Created Superuser: admin")
        print("  Password: admin123")
    else:
        admin = User.objects.get(username='admin')
        admin.set_password('admin123')
        admin.is_superuser = True
        admin.is_staff = True
        admin.role = 'admin'
        admin.save()
        print("[SUCCESS] Reset Superuser 'admin' password to: admin123")
        
    # 2. Teacher User
    if not User.objects.filter(username='teacher1').exists():
        User.objects.create_user(
            username='teacher1',
            email='teacher1@cms.local',
            password='teacher123',
            first_name='John',
            last_name='Teacher',
            role='teacher',
        )
        print("[SUCCESS] Created Teacher User: teacher1")
        print("  Password: teacher123")
    else:
        teacher = User.objects.get(username='teacher1')
        teacher.set_password('teacher123')
        teacher.role = 'teacher'
        teacher.save()
        print("[SUCCESS] Reset Teacher 'teacher1' password to: teacher123")
        
    # 3. Student User
    if not User.objects.filter(username='student1').exists():
        User.objects.create_user(
            username='student1',
            email='student1@cms.local',
            password='student123',
            first_name='Jane',
            last_name='Student',
            role='student',
        )
        print("[SUCCESS] Created Student User: student1")
        print("  Password: student123")
    else:
        student = User.objects.get(username='student1')
        student.set_password('student123')
        student.role = 'student'
        student.save()
        print("[SUCCESS] Reset Student 'student1' password to: student123")
        
    print("=" * 50)
    print("Credentials Setup Complete! You can now log in.")
    print("=" * 50)

if __name__ == '__main__':
    create_fresh_credentials()
