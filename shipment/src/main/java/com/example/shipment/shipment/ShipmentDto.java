package com.example.shipment.shipment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Container for shipment-related DTOs.
 */
public class ShipmentDto {

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateShipmentRequest {
        @NotBlank(message = "Origin is required")
        @Size(min = 3, max = 255)
        public String origin;

        @NotBlank(message = "Destination is required")
        @Size(min = 3, max = 255)
        public String destination;

        @NotBlank(message = "Estimated delivery is required")
        @Size(min = 3, max = 255)
        public String estimatedDelivery;

        /** Optional customer to assign to this shipment. */
        private Long customerId;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShipmentResponse {
        private Long id;
        private String trackingNumber;
        private String origin;
        private String destination;
        private String estimatedDelivery;
        private ShipmentStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String currentLocation;
        private Long customerId;
        private Long driverId;
        private LocalDateTime assignedAt;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignDriverRequest {
        @NotNull(message = "Driver ID is required")
        private Long driverId;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignCustomerRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateShipmentStatusRequest {
        @NotNull(message = "Status is required")
        private ShipmentStatus status;

        private String currentLocation;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateShipmentLocationRequest {
        
        @Size(min = 3, max = 255)
        private String currentLocation;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateShipmentDeliveryDateRequest {
        @NotNull(message = "Delivery date is required")
        private LocalDateTime deliveryDate;
    }


    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateMessage {
        private Long shipmentId;
        private String trackingNumber;
        private ShipmentStatus status;
        private String currentLocation;
        private String message;
        private LocalDateTime updatedAt;
    }
}