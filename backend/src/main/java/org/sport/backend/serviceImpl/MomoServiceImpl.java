package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.properties.MomoProperties;
import org.sport.backend.service.MomoService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MomoServiceImpl implements MomoService {

    private final MomoProperties momoProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String MOMO_API_URL = "https://test-payment.momo.vn/v2/gateway/api/create";

    @Override
    public String createMomoPayment(String bookingIntentId, long amount, String orderInfo) throws Exception {
        // Dùng .trim() để triệt tiêu toàn bộ khoảng trắng ẩn từ file properties
        String partnerCode = momoProperties.getPartnerCode().trim();
        String accessKey = momoProperties.getAccessKey().trim();
//        String secretKey = momoProperties.getSecretKey().trim();
        String ipnUrl = momoProperties.getIpnUrl().trim();
        String redirectUrl = momoProperties.getRedirectUrl().trim();
        String requestType = momoProperties.getRequestType().trim();

        String secretKey = "at67qH6mk8w5Y1nAyS74sBJW1L7D4u8E";

        String requestId = UUID.randomUUID().toString();
        String extraData = "";

        // Chuỗi tạo chữ ký lúc Create Payment
        String rawHash = "accessKey=" + accessKey +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + ipnUrl +
                "&orderId=" + bookingIntentId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + partnerCode +
                "&redirectUrl=" + redirectUrl +
                "&requestId=" + requestId +
                "&requestType=" + requestType;

        String signature = hmacSHA256(rawHash, secretKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", partnerCode);
        requestBody.put("accessKey", accessKey);
        requestBody.put("requestId", requestId);
        requestBody.put("amount", amount);
        requestBody.put("orderId", bookingIntentId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", redirectUrl);
        requestBody.put("ipnUrl", ipnUrl);
        requestBody.put("lang", "vi");
        requestBody.put("extraData", extraData);
        requestBody.put("requestType", requestType);
        requestBody.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        log.info("=== MOMO REQUEST BODY === : {}", requestBody);

        ResponseEntity<Map> response = restTemplate.postForEntity(MOMO_API_URL, entity, Map.class);

        if (response.getBody() != null && response.getBody().containsKey("payUrl")) {
            return (String) response.getBody().get("payUrl");
        } else {
            log.error("MoMo Response: {}", response.getBody());
            throw new RuntimeException("Không thể tạo URL thanh toán MoMo");
        }
    }

    @Override
    public boolean verifySignature(Map<String, Object> ipnData, String receivedSignature) {
        try {
            String partnerCode = momoProperties.getPartnerCode().trim();
            String accessKey = momoProperties.getAccessKey().trim();
            String secretKey = momoProperties.getSecretKey().trim();

            // Cấu trúc Raw Hash dành RIÊNG cho IPN theo chuẩn tài liệu MoMo V2
            String rawHash =
                    "accessKey=" + accessKey +
                            "&amount=" + ipnData.get("amount") +
                            "&extraData=" + ipnData.get("extraData") +
                            "&message=" + ipnData.get("message") +
                            "&orderId=" + ipnData.get("orderId") +
                            "&orderInfo=" + ipnData.get("orderInfo") +
                            "&orderType=" + ipnData.get("orderType") +
                            "&partnerCode=" + partnerCode +
                            "&payType=" + ipnData.get("payType") +
                            "&requestId=" + ipnData.get("requestId") +
                            "&responseTime=" + ipnData.get("responseTime") +
                            "&resultCode=" + ipnData.get("resultCode") +
                            "&transId=" + ipnData.get("transId");

            log.info("IPN RAW HASH = {}", rawHash);

            String expectedSignature = hmacSHA256(rawHash, secretKey);
            return expectedSignature.equals(receivedSignature);
        } catch (Exception e) {
            log.error("Lỗi khi verify signature: ", e);
            return false;
        }
    }

    private String hmacSHA256(String data, String secretKey) throws Exception {
        Mac hmacSha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        hmacSha256.init(secretKeySpec);
        byte[] hash = hmacSha256.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}