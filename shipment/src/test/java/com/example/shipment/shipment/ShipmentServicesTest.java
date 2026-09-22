package com.example.shipment.shipment;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ShipmentServices.
 *
 * Same approach as DriverServiceTest: no Spring, no database — the four
 * repositories are Mockito mocks so we test only the service's own logic.
 *
 * Note on what is (and isn't) tested here: we cover the methods that contain
 * real decisions — creating a shipment, assigning a driver, updating status,
 * and the filter branching in getAllShipments — plus their main failure paths.
 * We deliberately skip trivial pass-through finders and getters, which have no
 * logic worth testing.
 */
@ExtendWith(MockitoExtension.class)
class ShipmentServicesTest {

    @Mock private ShipmentRepository shipmentRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private PackageRepository packageRepository;

    @InjectMocks private ShipmentServices shipmentServices;

    @Test
    void createShipment_generatesTrackingNumberAndSaves() {
        // Arrange: a request with no customer attached
        ShipmentDto.CreateShipmentRequest request = new ShipmentDto.CreateShipmentRequest();
        request.origin = "Casablanca";
        request.destination = "Rabat";
        request.estimatedDelivery = "2026-10-01";
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        ShipmentDto.ShipmentResponse response = shipmentServices.createShipment(request);

        // Assert: fields copied through, and a tracking number was generated
        assertEquals("Casablanca", response.getOrigin());
        assertEquals("Rabat", response.getDestination());
        assertNotNull(response.getTrackingNumber());
        assertTrue(response.getTrackingNumber().startsWith("TRK-"),
                "tracking number should be prefixed with TRK-");
        // ArgumentCaptor lets us inspect exactly what was passed to save()
        ArgumentCaptor<Shipment> captor = ArgumentCaptor.forClass(Shipment.class);
        verify(shipmentRepository).save(captor.capture());
        assertNull(captor.getValue().getCustomer(), "no customer was requested");
    }

    @Test
    void createShipment_throws_whenRequestedCustomerMissing() {
        // Arrange: request references a customer id that doesn't exist
        ShipmentDto.CreateShipmentRequest request = new ShipmentDto.CreateShipmentRequest();
        request.origin = "A";
        request.destination = "B";
        request.estimatedDelivery = "2026-10-01";
        request.setCustomerId(99L);
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(EntityNotFoundException.class, () -> shipmentServices.createShipment(request));
        verify(shipmentRepository, never()).save(any());
    }

    @Test
    void assignDriver_setsDriverAndTimestamp() {
        // Arrange
        Shipment shipment = Shipment.builder().id(1L).build();
        Driver driver = Driver.builder().id(2L).build();
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(driverRepository.findById(2L)).thenReturn(Optional.of(driver));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));
        ShipmentDto.AssignDriverRequest request =
                ShipmentDto.AssignDriverRequest.builder().driverId(2L).build();

        // Act
        ShipmentDto.ShipmentResponse response = shipmentServices.assignDriver(1L, request);

        // Assert: driver linked and assignedAt stamped
        assertEquals(2L, response.getDriverId());
        assertNotNull(response.getAssignedAt(), "assignedAt should be set when a driver is assigned");
    }

    @Test
    void assignDriver_throws_whenDriverNotFound() {
        Shipment shipment = Shipment.builder().id(1L).build();
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(driverRepository.findById(2L)).thenReturn(Optional.empty());
        ShipmentDto.AssignDriverRequest request =
                ShipmentDto.AssignDriverRequest.builder().driverId(2L).build();

        assertThrows(EntityNotFoundException.class, () -> shipmentServices.assignDriver(1L, request));
        verify(shipmentRepository, never()).save(any());
    }

    @Test
    void updateShipmentStatus_updatesStatusAndLocation() {
        Shipment shipment = Shipment.builder().id(1L).status(ShipmentStatus.ORDER_PLACED).build();
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));
        ShipmentDto.UpdateShipmentStatusRequest request =
                ShipmentDto.UpdateShipmentStatusRequest.builder()
                        .status(ShipmentStatus.IN_TRANSIT)
                        .currentLocation("Highway A1")
                        .build();

        ShipmentDto.ShipmentResponse response = shipmentServices.updateShipmentStatus(1L, request);

        assertEquals(ShipmentStatus.IN_TRANSIT, response.getStatus());
        assertEquals("Highway A1", response.getCurrentLocation());
    }

    @Test
    void getAllShipments_usesStatusQuery_whenOnlyStatusGiven() {
        // This method branches 4 ways depending on which filters are present.
        // Here we check that giving ONLY a status calls the status-specific query.
        when(shipmentRepository.findByStatus(ShipmentStatus.DELIVERED))
                .thenReturn(List.of(Shipment.builder().id(1L).status(ShipmentStatus.DELIVERED).build()));

        List<ShipmentDto.ShipmentResponse> result =
                shipmentServices.getAllShipments(null, ShipmentStatus.DELIVERED);

        assertEquals(1, result.size());
        // verify the RIGHT repository method was chosen, and the others weren't
        verify(shipmentRepository).findByStatus(ShipmentStatus.DELIVERED);
        verify(shipmentRepository, never()).findAll();
        verify(shipmentRepository, never()).findByCustomer_Id(any());
    }
}
