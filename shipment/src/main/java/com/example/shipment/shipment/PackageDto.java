package com.example.shipment.shipment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class PackageDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        @NotNull(message = "Shipment ID is required")
        private Long shipmentId;

        private String description;
        private Double weightKg;
        private Double widthCm;
        private Double heightCm;
        private Double depthCm;

        @Builder.Default
        private Boolean fragile = false;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackageResponse {
        private Long id;
        private Long shipmentId;
        private String description;
        private Double weightKg;
        private Double widthCm;
        private Double heightCm;
        private Double depthCm;
        private Boolean fragile;
        private LocalDateTime createdAt;
    }
}
