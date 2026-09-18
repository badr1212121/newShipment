package com.example.shipment.shipment;

import org.springframework.stereotype.Service;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.persistence.EntityNotFoundException;

@Service
@AllArgsConstructor
@Slf4j
public class ShipmentServices {

    private final ShipmentRepository shipmentRepository;
    private final DriverRepository driverRepository;
    private final CustomerRepository customerRepository;
    private final PackageRepository packageRepository;


    public List<ShipmentDto.ShipmentResponse> getAllShipments() {
        return getAllShipments(null, null);
    }

    public List<ShipmentDto.ShipmentResponse> findByCustomerUserId(Long userId) {
        return shipmentRepository.findByCustomerUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ShipmentDto.ShipmentResponse> findByDriverUserId(Long userId) {
        return shipmentRepository.findByDriverUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ShipmentDto.ShipmentResponse> getAllShipments(Long customerId, ShipmentStatus status) {
        List<Shipment> shipments;
        if (customerId != null && status != null) {
            shipments = shipmentRepository.findByCustomer_IdAndStatus(customerId, status);
        } else if (customerId != null) {
            shipments = shipmentRepository.findByCustomer_Id(customerId);
        } else if (status != null) {
            shipments = shipmentRepository.findByStatus(status);
        } else {
            shipments = shipmentRepository.findAll();
        }
        return shipments.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public ShipmentDto.ShipmentResponse createShipment(ShipmentDto.CreateShipmentRequest request)  {
        Shipment shipment = Shipment.builder()
            .trackingNumber("TRK-" + java.util.UUID.randomUUID().toString().substring(0, 8))
            .origin(request.origin)
            .destination(request.destination)
            .estimatedDelivery(request.estimatedDelivery)
            .build();
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new EntityNotFoundException("Customer not found"));
            shipment.setCustomer(customer);
        }
        shipmentRepository.save(shipment);
        return mapToResponse(shipment);
    }

    public ShipmentDto.ShipmentResponse assignCustomer(Long shipmentId, Long customerId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found"));
        shipment.setCustomer(customer);
        shipment = shipmentRepository.save(shipment);
        return mapToResponse(shipment);
    }

    private ShipmentDto.ShipmentResponse mapToResponse(Shipment shipment) {
        return ShipmentDto.ShipmentResponse.builder()
            .id(shipment.getId())
            .trackingNumber(shipment.getTrackingNumber())
            .origin(shipment.getOrigin())
            .destination(shipment.getDestination())
            .estimatedDelivery(shipment.getEstimatedDelivery())
            .currentLocation(shipment.getCurrentLocation())
            .status(shipment.getStatus())
            .createdAt(shipment.getCreatedAt())
            .updatedAt(shipment.getUpdatedAt())
            .customerId(shipment.getCustomer() != null ? shipment.getCustomer().getId() : null)
            .driverId(shipment.getDriver() != null ? shipment.getDriver().getId() : null)
            .assignedAt(shipment.getAssignedAt())
            .build();
    }

    public ShipmentDto.ShipmentResponse getShipmentById(Long id) {
        var shipment = shipmentRepository.findById(id);
        if (shipment.isPresent()) {
            return mapToResponse(shipment.get());
        } else {
            throw new EntityNotFoundException("Shipment not found");
        }
    }

    public ShipmentDto.ShipmentResponse getShipmentByTrackingNumber(String trackingNumber) {
        var shipment = shipmentRepository.findByTrackingNumber(trackingNumber);
        if (shipment.isPresent()) {
            return mapToResponse(shipment.get());
        } else {
            throw new EntityNotFoundException("Shipment not found with tracking number: " + trackingNumber);
        }
    }

    public ShipmentDto.ShipmentResponse updateShipmentStatus(Long id, ShipmentDto.UpdateShipmentStatusRequest request) {
        Shipment shipment = shipmentRepository
                .findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));

        shipment.setStatus(request.getStatus());
        if (request.getCurrentLocation() != null) {
            shipment.setCurrentLocation(request.getCurrentLocation());
        }

        shipmentRepository.save(shipment);
        return mapToResponse(shipment);
    }

    public ShipmentDto.ShipmentResponse assignDriver(Long shipmentId, ShipmentDto.AssignDriverRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));
        Driver driver = driverRepository.findById(request.getDriverId())
                .orElseThrow(() -> new EntityNotFoundException("Driver not found"));
        shipment.setDriver(driver);
        shipment.setAssignedAt(java.time.LocalDateTime.now());
        shipment = shipmentRepository.save(shipment);
        return mapToResponse(shipment);
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));
        packageRepository.findByShipment_Id(id).forEach(packageRepository::delete);
        shipmentRepository.delete(shipment);
    }

}

