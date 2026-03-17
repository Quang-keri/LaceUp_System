package org.sport.backend.serviceImpl;

import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingIntent;
import org.sport.backend.entity.Payment;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.BookingIntentRepository;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PaymentServiceImpl implements PaymentService {
    @Autowired
    private BookingService bookingService;
    @Autowired
    private BookingIntentRepository bookingIntentRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Override
    public CheckoutResponse checkout(CheckoutRequest checkoutRequest) {
        BookingIntent bookingIntent = bookingIntentRepository.findById(checkoutRequest.getBookingIntentId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));


        BookingResponse bookingResponse = bookingService.confirmBooking(bookingIntent.getBookingIntentId());


        Booking booking = bookingRepository.findById(bookingResponse.getBookingId()).orElse(null);

        Payment payment = Payment.builder()
                .user(bookingIntent.getUser())
                .booking(booking)
                .amount(bookingIntent.getPreviewPrice())
                .paymentMethod(checkoutRequest.getPaymentMethod())
                .transactionDate(LocalDateTime.now())
                .build();

        if (checkoutRequest.getPaymentMethod() == PaymentMethod.CASH) {
            payment.setPaymentStatus(PaymentStatus.BOOKED);
        } else {
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
        }


        paymentRepository.save(payment);
        return CheckoutResponse.builder()
                .bookingId(bookingResponse.getBookingId())
                .paymentStatus(payment.getPaymentStatus())
                .build();
    }
}
