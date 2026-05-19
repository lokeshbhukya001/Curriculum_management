import os
import django

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def reset_all_passwords():
    print("=" * 60)
    print("Resetting Passwords for Restored Users in MySQL")
    print("=" * 60)
    
    users = User.objects.all()
    admin_users = []
    teacher_users = []
    student_users = []
    
    for user in users:
        # Reset password based on role
        if user.role == 'admin' or user.is_superuser:
            user.set_password('admin123')
            user.save()
            admin_users.append(user.username)
        elif user.role == 'teacher':
            user.set_password('teacher123')
            user.save()
            teacher_users.append(user.username)
        else: # student or others
            user.set_password('student123')
            user.save()
            student_users.append(user.username)
            
    print("\n--- ADMIN ACCOUNTS (Password: admin123) ---")
    for u in admin_users:
        print(f"  • {u}")
        
    print("\n--- TEACHER ACCOUNTS (Password: teacher123) ---")
    for u in teacher_users:
        print(f"  • {u}")
        
    print("\n--- STUDENT ACCOUNTS (Password: student123) ---")
    for u in student_users:
        print(f"  • {u}")
        
    print("=" * 60)
    print("All passwords reset successfully! You can use any of these now.")
    print("=" * 60)

if __name__ == '__main__':
    reset_all_passwords()
