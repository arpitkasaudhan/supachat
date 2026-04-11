#!/bin/bash
# SupaChat EC2 Setup Script
# Run as: bash setup_ec2.sh
# Tested on: Ubuntu 22.04 LTS (t2.medium or larger)
set -euo pipefail

echo "=== SupaChat EC2 Setup ==="

# 1. Update & install Docker
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

echo "Docker installed: $(docker --version)"

# 2. Clone repo
REPO_URL="${REPO_URL:-https://github.com/YOUR_USERNAME/supachat.git}"
sudo mkdir -p /opt/supachat
sudo chown $USER:$USER /opt/supachat
git clone "$REPO_URL" /opt/supachat || (cd /opt/supachat && git pull)

# 3. Create .env
if [ ! -f /opt/supachat/.env ]; then
  cp /opt/supachat/.env.example /opt/supachat/.env
  echo ""
  echo ">>> ACTION REQUIRED: Edit /opt/supachat/.env with your credentials"
  echo "    nano /opt/supachat/.env"
  echo ""
fi

# 4. Open firewall ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 3001/tcp # Grafana
sudo ufw allow 9090/tcp # Prometheus (restrict in prod)
sudo ufw --force enable

echo "=== Setup complete! ==="
echo "Next steps:"
echo "  1. Edit /opt/supachat/.env"
echo "  2. cd /opt/supachat"
echo "  3. docker compose up -d"
echo "  4. docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d"
echo ""
echo "App: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
