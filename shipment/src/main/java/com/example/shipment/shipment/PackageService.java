package com.example.shipment.shipment;

import com.example.shipment.shipment.PackageDto.CreateRequest;
import com.example.shipment.shipment.PackageDto.PackageResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PackageService {

    private final PackageRepository packageRepository;
    private final ShipmentRepository shipmentRepository;

    public List<PackageResponse> findAll() {
        return packageRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PackageResponse findById(Long id) {
        ShipmentPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Package not found: " + id));
        return toResponse(pkg);
    }

    public List<PackageResponse> findByShipmentId(Long shipmentId) {
        return packageRepository.findByShipment_Id(shipmentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PackageResponse create(CreateRequest request) {
        Shipment shipment = shipmentRepository.findById(request.getShipmentId())
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found: " + request.getShipmentId()));
        Boolean fragile = request.getFragile() != null ? request.getFragile() : false;
        ShipmentPackage pkg = ShipmentPackage.builder()
                .shipment(shipment)
                .description(request.getDescription())
                .weightKg(request.getWeightKg())
                .widthCm(request.getWidthCm())
                .heightCm(request.getHeightCm())
                .depthCm(request.getDepthCm())
                .fragile(fragile)
                .build();
        pkg = packageRepository.save(pkg);
        return toResponse(pkg);
    }

    @Transactional
    public void delete(Long id) {
        if (!packageRepository.existsById(id)) {
            throw new EntityNotFoundException("Package not found: " + id);
        }
        packageRepository.deleteById(id);
    }

    private PackageResponse toResponse(ShipmentPackage pkg) {
        return PackageResponse.builder()
                .id(pkg.getId())
                .shipmentId(pkg.getShipment().getId())
                .description(pkg.getDescription())
                .weightKg(pkg.getWeightKg())
                .widthCm(pkg.getWidthCm())
                .heightCm(pkg.getHeightCm())
                .depthCm(pkg.getDepthCm())
                .fragile(pkg.getFragile())
                .createdAt(pkg.getCreatedAt())
                .build();
    }
}
