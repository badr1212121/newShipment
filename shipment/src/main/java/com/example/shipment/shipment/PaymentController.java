package com.example.shipment.shipment;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    /**
     * Customer clicks "Pay" -> we create a Stripe Checkout session and return
     * its URL. The frontend then redirects the browser to that URL.
     */
    @PostMapping("/checkout/{shipmentId}")
    public ResponseEntity<?> createCheckout(@PathVariable Long shipmentId) {
        try {
            String url = paymentService.createCheckoutSession(shipmentId);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            log.error("Failed to create checkout session", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Called by the frontend success page. Verifies with Stripe that the
     * session was paid, then marks the shipment paid. Reliable confirmation
     * that works even without a webhook listener.
     */
    @PostMapping("/confirm/{shipmentId}")
    public ResponseEntity<?> confirm(
            @PathVariable Long shipmentId,
            @RequestParam String sessionId) {
        try {
            boolean paid = paymentService.confirmPayment(shipmentId, sessionId);
            return ResponseEntity.ok(Map.of("paid", paid));
        } catch (Exception e) {
            log.error("Failed to confirm payment", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Stripe calls this server-to-server after a payment.
     * We must VERIFY the signature to be sure the request really came from
     * Stripe (and not a forged request), then act on the event.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            // Verifies the payload was signed with OUR webhook secret.
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Webhook signature verification failed");
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        // We only care about a completed checkout.
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject().orElse(null);
            if (session != null && session.getMetadata() != null) {
                String shipmentId = session.getMetadata().get("shipmentId");
                if (shipmentId != null) {
                    paymentService.markShipmentPaid(Long.valueOf(shipmentId));
                }
            }
        }

        // Always return 200 quickly so Stripe knows we received it.
        return ResponseEntity.ok("");
    }
}
