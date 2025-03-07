data "azurerm_container_app_environment" "main" {
  name                = "managedEnvironment-digibaton-a6d9"
  resource_group_name = azurerm_resource_group.digi_baton.name
}

resource "azurerm_container_app" "frontend" {
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  name                         = "frontend-dev"
  resource_group_name          = azurerm_resource_group.digi_baton.name
  revision_mode                = "Single"
  tags                         = {}
  workload_profile_name        = "Consumption"
  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    transport                  = "auto"
    traffic_weight {
      label           = null
      latest_revision = true
      percentage      = 100
      revision_suffix = null
    }
  }
  registry {
    identity = data.azurerm_user_assigned_identity.main.id
    server   = "digibaton.azurecr.io"
  }
  template {
    max_replicas = 10
    min_replicas = 1
    container {
      args    = []
      command = []
      cpu     = 0.5
      image   = "digibaton.azurecr.io/frontend-dev:latest"
      memory  = "1Gi"
      name    = "frontend-dev"
      env {
        name        = "PORT"
        secret_name = null
        value       = "8080"
      }
      # env {
      #   name        = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
      #   secret_name = "clerk-pub-key"
      # }
      env {
        name        = "NEXT_PUBLIC_CLERK_SIGN_UP_URL"
        secret_name = null
        value       = "/sign-up"
      }
      env {
        name        = "NEXT_PUBLIC_CLERK_SIGN_IN_URL"
        secret_name = null
        value       = "/sign-in"
      }
      # env {
      #   name        = "CLERK_SECRET_KEY"
      #   secret_name = "clerk-secret-key"
      #   value       = null
      # }
    }
  }
  secret {
    identity            = data.azurerm_user_assigned_identity.main.id
    name                = "clerk-pub-key"
    key_vault_secret_id = data.azurerm_key_vault_secret.clerk_pub_key.id
  }
  secret {
    identity            = data.azurerm_user_assigned_identity.main.id
    name                = "clerk-secret-key"
    key_vault_secret_id = data.azurerm_key_vault_secret.clerk_secret_key.id
  }
  identity {
    identity_ids = [
      data.azurerm_user_assigned_identity.main.id
    ]
    type = "SystemAssigned, UserAssigned"
  }
  lifecycle {
    ignore_changes = [
      secret, template[0].container[0].env, registry
    ]
  }
}

resource "azurerm_container_app" "backend" {
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  name                         = "backend-dev"
  resource_group_name          = azurerm_resource_group.digi_baton.name
  revision_mode                = "Single"
  tags                         = {}
  workload_profile_name        = "Consumption"
  identity {
    identity_ids = [
      data.azurerm_user_assigned_identity.main.id
    ]
    type = "SystemAssigned, UserAssigned"
  }
  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    transport                  = "auto"
    traffic_weight {
      label           = null
      latest_revision = true
      percentage      = 100
      revision_suffix = null
    }
  }
  registry {
    identity = data.azurerm_user_assigned_identity.main.id
    server   = "digibaton.azurecr.io"
  }
  template {
    max_replicas = 10
    min_replicas = 1
    container {
      args    = []
      command = []
      cpu     = 0.5
      image   = "digibaton.azurecr.io/backend-dev:latest"
      memory  = "1Gi"
      name    = "backend-dev"
      env {
        name        = "CLERK_SECRET_KEY"
        secret_name = "clerk-secret-key"
        value       = null
      }
      env {
        name        = "DB_NAME"
        secret_name = null
        value       = "backend-dev"
      }
      env {
        name        = "DB_USER"
        secret_name = null
        value       = "system"
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "pg-password"
        value       = null
      }
      env {
        name        = "DB_PORT"
        secret_name = null
        value       = "5432"
      }
      env {
        name        = "DB_HOST"
        secret_name = null
        value       = azurerm_postgresql_flexible_server.main.fqdn
      }
      env {
        name        = "SSL"
        secret_name = null
        value       = "true"
      }
    }
  }
  secret {
    identity            = data.azurerm_user_assigned_identity.main.id
    name                = "pg-password"
    key_vault_secret_id = data.azurerm_key_vault_secret.pg_password.id
  }
  lifecycle {
    ignore_changes = [
      secret, template[0].container[0].env, registry
    ]
  }
}
