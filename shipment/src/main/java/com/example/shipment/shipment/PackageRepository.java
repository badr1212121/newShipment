package com.example.shipment.shipment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageRepository extends JpaRepository<ShipmentPackage, Long> {

    List<ShipmentPackage> findByShipment_Id(Long shipmentId);
}
