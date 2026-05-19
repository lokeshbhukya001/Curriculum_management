#!/usr/bin/env python
"""
Django setup script to initialize the database with roles and admin user
Run this after migrations: python setup_roles.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from student_data.models import Role

User = get_user_model()

def setup_roles():
    """Create default roles"""
    roles_data = [
        {
            'name': 'admin',
            'description': 'Full system access',
            'permissions': {
                'create_program': True,
                'edit_program': True,
                'delete_program': True,
                'manage_users': True,
                'view_audit_logs': True,
            }
        },
        {
            'name': 'teacher',
            'description': 'Can manage assigned courses',
            'permissions': {
                'edit_own_course': True,
                'upload_materials': True,
                'view_enrollments': True,
            }
        },
        {
            'name': 'student',
            'description': 'Can view enrolled courses',
            'permissions': {
                'view_courses': True,
                'download_materials': True,
            }
        },
    ]
    
    for role_data in roles_data:
        role, created = Role.objects.get_or_create(
            name=role_data['name'],
            defaults={
                'description': role_data['description'],
                'permissions': role_data['permissions'],
            }
        )
        if created:
            print(f"✓ Created role: {role.name}")
        else:
            print(f"✓ Role exists: {role.name}")


def setup_admin_user():
    """Create default admin user"""
    if not User.objects.filter(username='admin').exists():
        admin_role = Role.objects.get(name='admin')
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@cms.local',
            password='admin123',
            first_name='Administrator',
            last_name='User',
            role=admin_role,
            is_verified=True,
        )
        print(f"✓ Created admin user: admin@cms.local")
        print(f"  Password: admin123")
    else:
        print(f"✓ Admin user already exists")


def setup_demo_users():
    """Create demo users for testing"""
    demo_users = [
        {
            'username': 'teacher1',
            'email': 'teacher@cms.local',
            'password': 'teacher123',
            'role': 'teacher',
            'first_name': 'John',
            'last_name': 'Smith',
        },
        {
            'username': 'student1',
            'email': 'student@cms.local',
            'password': 'student123',
            'role': 'student',
            'first_name': 'Jane',
            'last_name': 'Doe',
        },
    ]
    
    for user_data in demo_users:
        if not User.objects.filter(username=user_data['username']).exists():
            role = Role.objects.get(name=user_data['role'])
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=role,
                is_verified=True,
            )
            print(f"✓ Created {user_data['role']}: {user_data['username']}")
            print(f"  Email: {user_data['email']}")
            print(f"  Password: {user_data['password']}")
        else:
            print(f"✓ {user_data['role'].capitalize()} already exists: {user_data['username']}")


if __name__ == '__main__':
    print("\n" + "="*50)
    print("Setting up CMS Database")
    print("="*50 + "\n")
    
    try:
        setup_roles()
        print()
        setup_admin_user()
        print()
        setup_demo_users()
        
        print("\n" + "="*50)
        print("✓ Setup completed successfully!")
        print("="*50)
        print("\nYou can now login with:")
        print("  Admin: admin / admin123")
        print("  Teacher: teacher1 / teacher123")
        print("  Student: student1 / student123")
        print()
        
    except Exception as e:
        print(f"\n✗ Setup failed: {str(e)}")
        sys.exit(1)
