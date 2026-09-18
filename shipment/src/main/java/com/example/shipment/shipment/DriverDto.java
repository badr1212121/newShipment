package com.example.shipment.shipment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class DriverDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        @NotNull(message = "User ID is required")
        private Long userId;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private String phone;
        private String licenseNumber;
        private String currentLocation;

        @Builder.Default
        private DriverStatus status = DriverStatus.AVAILABLE;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String fullName;
        private String phone;
        private String licenseNumber;
        private String currentLocation;
        private DriverStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateLocationRequest {
        @NotBlank(message = "Current location is required")
        private String currentLocation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DriverResponse {
        private Long id;
        private Long userId;
        private String fullName;
        private String phone;
        private String licenseNumber;
        private String currentLocation;
        private DriverStatus status;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DriverLocationMessage {
        private Long driverId;
        private String currentLocation;
        private LocalDateTime updatedAt;
    }
}
