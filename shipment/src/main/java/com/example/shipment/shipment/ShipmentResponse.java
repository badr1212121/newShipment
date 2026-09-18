package com.example.shipment.shipment;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder
@Data
@Getter
@Setter
public class ShipmentResponse {
    public String trackingNumber;
    public String origin;
    public String destination;
    public String estimatedDelivery;
    public ShipmentStatus status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
