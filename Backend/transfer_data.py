import subprocess
import os

def run():
    print("=" * 60)
    print("STARTING DATA TRANSFER FROM SQLITE TO MYSQL")
    print("=" * 60)

    # Step 1: Dump data from SQLite by running dumpdata with DATABASE_URL set to empty
    print("Step 1: Extracting old data from your local SQLite database...")
    env = os.environ.copy()
    env["DATABASE_URL"] = "" # Forces fallback to SQLite in settings.py
    
    try:
        # Run dumpdata and write output to datadump.json
        with open("datadump.json", "w", encoding="utf-8") as f:
            result = subprocess.run(
                ["python", "manage.py", "dumpdata", "--exclude", "auth.Permission", "--exclude", "contenttypes", "--indent", "4"],
                env=env,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )
        if result.returncode != 0:
            print(f"Error dumping data: {result.stderr}")
            return
        print("[SUCCESS] Successfully extracted all old data into datadump.json")
    except Exception as e:
        print(f"Failed during dump: {e}")
        return

    # Step 1.5: Clear MySQL tables before loading to prevent duplicate key errors
    print("\nStep 1.5: Clearing live MySQL tables to prevent duplicate key conflicts...")
    try:
        clear_code = (
            "import django; import os; "
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); "
            "django.setup(); "
            "from django.contrib.auth import get_user_model; "
            "User = get_user_model(); "
            "User.objects.all().delete(); "
            "from apps.users.models import Institute; "
            "Institute.objects.all().delete();"
        )
        result = subprocess.run(
            ["python", "-c", clear_code],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Error clearing MySQL tables: {result.stderr}")
            return
        print("[SUCCESS] Cleared live MySQL tables successfully.")
    except Exception as e:
        print(f"Failed to clear MySQL tables: {e}")
        return

    # Step 2: Load data into MySQL using the DATABASE_URL in .env
    print("\nStep 2: Loading your old data into the live MySQL database...")
    try:
        # Run loaddata (will use default env with DATABASE_URL pointing to MySQL)
        result = subprocess.run(
            ["python", "manage.py", "loaddata", "datadump.json"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Error loading data into MySQL: {result.stderr}")
            print(f"Stdout details: {result.stdout}")
            return
        print("[SUCCESS] Successfully loaded all old data into your live MySQL database!")
        print("All your hard-earned programs, courses, modules, and topics are restored!")
    except Exception as e:
        print(f"Failed during load: {e}")
        return
        
    print("=" * 60)

if __name__ == "__main__":
    run()
