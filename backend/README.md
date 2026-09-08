## Backend

### Everytime
#### Linux/MacOS/Other UNIX Like OS
  ```
    ./mvnw spring-boot:run
  ```

#### Windows
  ```
    .\mvnw.cmd spring-boot:run
  ```

### Create Database

#### First Time
1. Install Dependencies
  ```
  sudo apt update
  sudo apt install postgresql postgresql-contrib postgis postgresql-16-postgis-3
  ```
2. Start and Enable
  ```
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  sudo systemctl status postgresql   # confirm it's running
  ```
3. Create Database
  ```
  sudo -u postgres psql
  CREATE DATABASE neuratransit;
  CREATE USER neura_user WITH PASSWORD 'SIH2026';
  GRANT ALL PRIVILEGES ON DATABASE neuratransit TO neura_user;
  \c neuratransit
  CREATE EXTENSION IF NOT EXISTS postgis;
  # Grant all privileges on public schema to neura_user
  GRANT ALL ON SCHEMA public TO neura_user;
  # Exit with \q
  # Verify PostGIS installation
  psql -h localhost -U neura_user -d neuratransit -c "SELECT PostGIS_Version();"
  ```
