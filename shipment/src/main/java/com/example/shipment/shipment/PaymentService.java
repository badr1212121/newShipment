package com.example.shipment.shipment;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ShipmentRepository shipmentRepository;

    // Injected from application.properties (real value from the gitignored local file)
    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // Default amount (in cents) if a shipment has none set yet: $50.00
    private static final long DEFAULT_AMOUNT_CENTS = 5000L;

    // Runs once at startup: tell the Stripe SDK which secret key to use.
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Creates a Stripe Checkout Session for a shipment and returns the URL
     * the frontend should redirect the customer to.
     */
    public String createCheckoutSession(Long shipmentId) throws StripeException {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));

        if (shipment.isPaid()) {
            throw new IllegalStateException("Shipment is already paid");
        }

        long amount = shipment.getAmount() != null ? shipment.getAmount() : DEFAULT_AMOUNT_CENTS;

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                // Where Stripe sends the customer after paying / cancelling.
                // {CHECKOUT_SESSION_ID} is replaced by Stripe with the real id,
                // which the frontend sends back so we can confirm the payment.
                .setSuccessUrl(frontendUrl + "/payment/success?shipmentId=" + shipmentId
                        + "&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment/cancel?shipmentId=" + shipmentId)
                // Put our shipment id in metadata so the webhook knows what was paid
                .putMetadata("shipmentId", String.valueOf(shipmentId))
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(amount) // in cents
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Shipment " + shipment.getTrackingNumber())
                                                                .build())
                                                .build())
                                .build())
                .build();

        Session session = Session.create(params);
        log.info("Created Stripe Checkout session {} for shipment {}", session.getId(), shipmentId);
        return session.getUrl();
    }

    /**
     * Confirm a payment by asking Stripe directly whether the checkout session
     * was paid. Called from the success page. This does NOT trust the browser —
     * it verifies with Stripe using our secret key, then marks the shipment paid.
     * (The webhook does the same thing server-to-server; this is the reliable
     * fallback that also works without a webhook listener.)
     */
    @Transactional
    public boolean confirmPayment(Long shipmentId, String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        // Stripe says "paid" only if the payment actually went through.
        boolean isPaid = "paid".equals(session.getPaymentStatus());
        // Make sure the session really belongs to this shipment.
        String metaShipmentId = session.getMetadata() != null
                ? session.getMetadata().get("shipmentId") : null;
        if (isPaid && String.valueOf(shipmentId).equals(metaShipmentId)) {
            markShipmentPaid(shipmentId);
            return true;
        }
        return false;
    }

    /**
     * Called by the webhook once Stripe confirms payment succeeded.
     * @Transactional because we update the shipment (and could add a payment
     * record) — those DB writes must all succeed together.
     */
    @Transactional
    public void markShipmentPaid(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found"));
        shipment.setPaid(true);
        shipment.setPaidAt(java.time.LocalDateTime.now());
        shipmentRepository.save(shipment);
        log.info("Shipment {} marked as PAID", shipmentId);
    }
}
