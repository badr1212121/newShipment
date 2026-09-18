package com.example.shipment.shipment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    @Query("SELECT s FROM Shipment s WHERE s.customer.user.id = :userId")
    List<Shipment> findByCustomerUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM Shipment s WHERE s.driver.user.id = :userId")
    List<Shipment> findByDriverUserId(@Param("userId") Long userId);

    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    List<Shipment> findByStatus(ShipmentStatus status);
    List<Shipment> findByOrigin(String origin);
    List<Shipment> findByDestination(String destination);
    List<Shipment> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Shipment> findByUpdatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Shipment> findByCreatedAtBetweenAndStatus(LocalDateTime start, LocalDateTime end, ShipmentStatus status);
    List<Shipment> findByUpdatedAtBetweenAndStatus(LocalDateTime start, LocalDateTime end, ShipmentStatus status);
    long countByCustomer_Id(Long customerId);
    List<Shipment> findByDriver_Id(Long driverId);
    List<Shipment> findByCustomer_Id(Long customerId);
    List<Shipment> findByCustomer_IdAndStatus(Long customerId, ShipmentStatus status);
}
