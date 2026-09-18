package com.example.shipment.shipment;

import com.example.shipment.shipment.PackageDto.CreateRequest;
import com.example.shipment.shipment.PackageDto.PackageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class PackageController {

    private final PackageService packageService;

    public PackageController(PackageService packageService) {
        this.packageService = packageService;
    }

    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<PackageResponse>> getPackagesByShipmentId(@PathVariable Long shipmentId) {
        List<PackageResponse> response = packageService.findByShipmentId(shipmentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PackageResponse> createPackage(@Valid @RequestBody CreateRequest request) {
        PackageResponse response = packageService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackageResponse> getPackageById(@PathVariable Long id) {
        PackageResponse response = packageService.findById(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePackage(@PathVariable Long id) {
        packageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
