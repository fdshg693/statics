output "resource_group_name" {
  description = "AKSクラスタのリソースグループ名"
  value       = azurerm_resource_group.this.name
}

output "cluster_name" {
  description = "AKSクラスタ名"
  value       = azurerm_kubernetes_cluster.this.name
}

output "kube_config" {
  description = "kubeconfig（az aks get-credentials での取得でも代替可）"
  value       = azurerm_kubernetes_cluster.this.kube_config_raw
  sensitive   = true
}

output "host" {
  description = "AKS APIサーバーのエンドポイント"
  value       = azurerm_kubernetes_cluster.this.kube_config[0].host
  sensitive   = true
}
