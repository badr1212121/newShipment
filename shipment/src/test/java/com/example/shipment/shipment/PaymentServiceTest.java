package com.example.shipment.shipment;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PaymentService.
 *
 * We test markShipmentPaid(), which is pure logic over the repository (mocked).
 * The Stripe-calling methods (createCheckoutSession / confirmPayment) hit Stripe's
 * servers, so they're covered by the manual end-to-end testing instead.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void markShipmentPaid_setsPaidAndTimestamp_whenShipmentExists() {
        // Arrange: an unpaid shipment
        Shipment shipment = Shipment.builder().id(1L).paid(false).build();
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        paymentService.markShipmentPaid(1L);

        // Assert: it flipped paid to true and stamped the time, then saved
        assertTrue(shipment.isPaid(), "shipment should be marked paid");
        assertNotNull(shipment.getPaidAt(), "paidAt should be set");
        verify(shipmentRepository).save(shipment);
    }

    @Test
    void markShipmentPaid_throws_whenShipmentNotFound() {
        // Arrange: repository finds nothing
        when(shipmentRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(EntityNotFoundException.class,
                () -> paymentService.markShipmentPaid(99L));
        // And it never tries to save
        verify(shipmentRepository, never()).save(any());
    }
}
