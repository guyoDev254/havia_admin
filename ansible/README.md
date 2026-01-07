# Ansible Deployment Configuration - Havia Admin Panel

This directory contains Ansible playbooks and configuration for automated deployment of the Havia Admin Panel.

## Structure

```
havia-admin/ansible/
├── ansible.cfg              # Ansible configuration
├── inventory/
│   └── hosts.yml           # Server inventory (generated from env vars)
├── playbooks/
│   └── deploy.yml          # Admin deployment playbook
├── group_vars/
│   └── production.yml      # Production environment variables
└── README.md               # This file
```

## Prerequisites

1. **Ansible installed** (minimum version 2.9)
   ```bash
   pip install ansible docker
   ```

2. **SSH access** to deployment server
   - SSH keys configured
   - User with sudo privileges

3. **Docker installed** on target server
   - Docker daemon running
   - User in docker group (or running as root)

4. **Docker Hub credentials** (or registry credentials)
   - Username and password/token

## Setup

### 1. Configure Inventory

The inventory is generated automatically from CI/CD secrets, but for local testing, create `inventory/hosts.yml`:

```yaml
all:
  children:
    production:
      hosts:
        admin_server:
          ansible_host: your-admin-server-ip
          ansible_user: root
          ansible_ssh_private_key_file: ~/.ssh/id_rsa
```

### 2. Configure Variables

Edit `group_vars/production.yml` to match your setup:

```yaml
docker_registry: "docker.io"
docker_image_admin: "guyo254/admin"
admin_port: 3001
```

## Deployment

### Manual Deployment

#### Deploy Admin:
```bash
cd havia-admin
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy.yml \
  -e "image_tag=latest" \
  -e "docker_username=your_username" \
  -e "docker_password=your_password" \
  -e "api_url=http://your-api-url:6000"
```

### Automated (SemaphoreCI)

Deployment is automatically triggered when:
1. Docker images are successfully built and pushed to registry
2. On push to `main` branch (via pipeline dependencies)
3. Manual pipeline trigger in SemaphoreCI

## Playbook: deploy.yml

Deploys the Havia Admin Panel:

- Pulls latest Docker image from registry
- Stops existing container
- Starts new container with environment variables
- Waits for service to be ready
- Cleans up old Docker images

**Variables:**
- `image_tag` - Docker image tag (default: `latest`)
- `docker_username` - Docker registry username
- `docker_password` - Docker registry password
- `api_url` - API URL (for admin panel)

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection manually
ssh -i ~/.ssh/your_key user@server

# Test with Ansible
ansible all -i ansible/inventory/hosts.yml -m ping
```

### Docker Login Issues

```bash
# Test Docker login manually on server
docker login -u username -p password

# Check if image is accessible
docker pull docker.io/guyo254/admin:latest
```

### Container Not Starting

```bash
# Check container logs on server
docker logs havia-admin

# Check container status
docker ps -a
docker inspect havia-admin
```

### Permission Issues

Ensure the SSH user has:
- Sudo privileges (no password if possible)
- Docker group membership OR run as root
- Access to deployment directories

## Security Best Practices

1. **Use SSH keys** instead of passwords
2. **Rotate SSH keys** regularly
3. **Use Docker Hub access tokens** instead of passwords
4. **Store secrets in CI/CD secrets** (not in code)
5. **Limit SSH access** to necessary IPs
6. **Use firewall rules** to restrict access
7. **Enable SSH key-only authentication** on servers
8. **Use separate deployment users** (not root if possible)

## Monitoring

After deployment, monitor:

- Container logs: `docker logs havia-admin`
- Container status: `docker ps`
- Application: `http://server:3001`
- Resource usage: `docker stats`

## Rollback

To rollback to a previous version:

```bash
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy.yml \
  -e "image_tag=previous-tag" \
  -e "docker_username=..." \
  -e "docker_password=..." \
  -e "api_url=..."
```

Or manually on server:
```bash
docker pull docker.io/guyo254/admin:previous-tag
docker stop havia-admin
docker rm havia-admin
docker run -d --name havia-admin --restart always \
  -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-api-url:6000 \
  docker.io/guyo254/admin:previous-tag
```

