variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the cluster"
  type        = list(string)
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_group_size" {
  description = "Node group size configuration"
  type = object({
    min_size       = number
    max_size       = number
    desired_size   = number
    instance_types = list(string)
  })
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
