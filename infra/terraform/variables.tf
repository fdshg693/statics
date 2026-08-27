variable "resource_group_name" {
  description = "AKSクラスタを配置するリソースグループ名"
  type        = string
  default     = "rg-statics"
}

variable "location" {
  description = "Azureリージョン"
  type        = string
  default     = "japaneast"
}

variable "cluster_name" {
  description = "AKSクラスタ名"
  type        = string
  default     = "statics-aks"
}

variable "kubernetes_version" {
  description = "AKSのKubernetesバージョン（nullの場合はAzureのデフォルトバージョンを使用）"
  type        = string
  default     = null
}

variable "node_count" {
  description = "デフォルトノードプールのノード数"
  type        = number
  default     = 2
}

variable "node_vm_size" {
  description = "デフォルトノードプールのVMサイズ"
  type        = string
  default     = "Standard_B2s"
}
