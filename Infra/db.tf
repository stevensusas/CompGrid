provider "aws" {
  region = "us-east-1"
}

# Define the security group for RDS access
resource "aws_security_group" "allow_rds_access" {
  name_prefix = "allow-rds-access-"

  ingress {
    from_port   = 5432                   # Postgres default port
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Define the security group for Redis access
resource "aws_security_group" "allow_redis_access" {
  name_prefix = "allow-redis-access-"

  ingress {
    from_port   = 6379                   # Redis default port
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Define the PostgreSQL RDS instance
resource "aws_db_instance" "CompGridDB" {
  allocated_storage    = 5
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = "db.t4g.micro"
  db_name              = "CompGridDB"
  username             = "compgrid"
  password             = "password123"
  parameter_group_name = "default.postgres16"
  publicly_accessible  = true
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.allow_rds_access.id]
}