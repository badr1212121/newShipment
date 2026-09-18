package com.example.shipment.shipment;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
@RestController
@RequestMapping("/api/shipments")
@AllArgsConstructor
public class ShipmentController {
    private final ShipmentServices shipmentServices;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createShipment(@Valid @RequestBody ShipmentDto.CreateShipmentRequest request) {
        var response = shipmentServices.createShipment(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping
    public ResponseEntity<List<ShipmentDto.ShipmentResponse>> getAllShipments(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) ShipmentStatus status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User currentUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        boolean isCustomer = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        boolean isDriver = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));

        List<ShipmentDto.ShipmentResponse> response;
        if (isCustomer) {
            response = shipmentServices.findByCustomerUserId(currentUser.getId());
        } else if (isDriver) {
            response = shipmentServices.findByDriverUserId(currentUser.getId());
        } else {
            response = shipmentServices.getAllShipments(customerId, status);
        }
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<ShipmentDto.ShipmentResponse> getShipmentById(@PathVariable Long id) {
        var response = shipmentServices.getShipmentById(id);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/tracking/{trackingNumber}")
    public ResponseEntity<ShipmentDto.ShipmentResponse> getShipmentByTrackingNumber(@PathVariable String trackingNumber) {
        var response = shipmentServices.getShipmentByTrackingNumber(trackingNumber);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ShipmentDto.ShipmentResponse> updateShipmentStatus(@PathVariable Long id,@Valid @RequestBody ShipmentDto.UpdateShipmentStatusRequest request ) {
        var response = shipmentServices.updateShipmentStatus(id, request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/{id}/assign-driver")
    public ResponseEntity<ShipmentDto.ShipmentResponse> assignDriver(
            @PathVariable Long id,
            @Valid @RequestBody ShipmentDto.AssignDriverRequest request
    ) {
        var response = shipmentServices.assignDriver(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/assign-customer")
    public ResponseEntity<ShipmentDto.ShipmentResponse> assignCustomer(
            @PathVariable Long id,
            @Valid @RequestBody ShipmentDto.AssignCustomerRequest request
    ) {
        var response = shipmentServices.assignCustomer(id, request.getCustomerId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipment(@PathVariable Long id) {
        shipmentServices.delete(id);
        return ResponseEntity.noContent().build();
    }
}   