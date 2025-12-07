package com.example.androidbiometria;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.appcompat.app.AlertDialog;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.ArrayList;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;

public class BiometricAuthHelper {

    private static final String KEY_NAME_PREFIX = "biometric_key_";
    private static final String PREFS_NAME = "biometric_prefs_multi_account";
    private static final String PREF_USER_LIST = "enrolled_users_list";

    private Context context;
    private SharedPreferences sharedPreferences;

    public interface AuthCallback {
        void onAuthSuccess(String email, String password);
        void onAuthError(String errorMessage);
    }

    public interface AccountSelectCallback {
        void onAccountSelected(FragmentActivity activity, String email);
    }

    public BiometricAuthHelper(Context context) {
        this.context = context;
        this.sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public boolean canAuthenticate() {
        BiometricManager biometricManager = BiometricManager.from(context);
        int result = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        return result == BiometricManager.BIOMETRIC_SUCCESS;
    }

    public List<String> getEnrolledUsers() {
        List<String> userEmails = new ArrayList<>();
        String jsonString = sharedPreferences.getString(PREF_USER_LIST, "[]");
        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject userObject = jsonArray.getJSONObject(i);
                userEmails.add(userObject.getString("email"));
            }
        } catch (JSONException e) {
            // Malformed JSON, return empty list
        }
        return userEmails;
    }

    public void showAccountSelector(FragmentActivity activity, AccountSelectCallback callback) {
        List<String> userEmails = getEnrolledUsers();
        if (userEmails.isEmpty()) {
            return; // Should not happen if button is disabled
        }
        
        new AlertDialog.Builder(activity)
                .setTitle("Seleccionar Cuenta")
                .setItems(userEmails.toArray(new String[0]), (dialog, which) -> {
                    callback.onAccountSelected(activity, userEmails.get(which));
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    public interface EnrollmentCallback {
        void onEnrollmentSuccess();
        void onEnrollmentFailure(String error);
    }

    public void enroll(FragmentActivity activity, String email, String password, EnrollmentCallback callback) {
        try {
            String keyAlias = KEY_NAME_PREFIX + email;
            generateSecretKey(keyAlias);
            
            Cipher cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/" + KeyProperties.BLOCK_MODE_CBC + "/" + KeyProperties.ENCRYPTION_PADDING_PKCS7);
            SecretKey secretKey = getSecretKey(keyAlias);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Confirmar Huella")
                    .setSubtitle("Confirma tu huella para guardar tus credenciales.")
                    .setNegativeButtonText("Cancelar")
                    .build();

            BiometricPrompt biometricPrompt = new BiometricPrompt(activity, ContextCompat.getMainExecutor(context), new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    try {
                        Cipher authenticatedCipher = result.getCryptoObject().getCipher();
                        byte[] iv = authenticatedCipher.getIV();
                        byte[] encryptedBytes = authenticatedCipher.doFinal(password.getBytes(StandardCharsets.UTF_8));
                        
                        CipherPair passwordCipher = new CipherPair(
                                Base64.encodeToString(encryptedBytes, Base64.DEFAULT),
                                Base64.encodeToString(iv, Base64.DEFAULT)
                        );

                        String jsonString = sharedPreferences.getString(PREF_USER_LIST, "[]");
                        JSONArray jsonArray = new JSONArray(jsonString);

                        JSONObject newUser = new JSONObject();
                        newUser.put("email", email);
                        newUser.put("encrypted_password", passwordCipher.encryptedData);
                        newUser.put("iv_password", passwordCipher.iv);
                        jsonArray.put(newUser);

                        sharedPreferences.edit().putString(PREF_USER_LIST, jsonArray.toString()).apply();
                        callback.onEnrollmentSuccess();
                    } catch (Exception e) {
                        removeUser(email);
                        String errorMessage = "Error al guardar la huella: " + e.getClass().getSimpleName();
                        if (e.getMessage() != null) {
                            errorMessage += " - " + e.getMessage();
                        }
                        callback.onEnrollmentFailure(errorMessage);
                    }
                }

                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    removeUser(email); // Clean up the generated key
                    callback.onEnrollmentFailure("Autenticación cancelada: " + errString);
                }
            });
            biometricPrompt.authenticate(promptInfo, cryptoObject);
        } catch (Exception e) {
            removeUser(email);
            String errorMessage = "Error al inicializar la biometría: " + e.getClass().getSimpleName();
            if (e.getMessage() != null) {
                errorMessage += " - " + e.getMessage();
            }
            callback.onEnrollmentFailure(errorMessage);
        }
    }
    
    public void removeUser(String email) {
        try {
            String jsonString = sharedPreferences.getString(PREF_USER_LIST, "[]");
            JSONArray jsonArray = new JSONArray(jsonString);
            JSONArray newJsonArray = new JSONArray();

            for (int i = 0; i < jsonArray.length(); i++) {
                if (!email.equals(jsonArray.getJSONObject(i).getString("email"))) {
                    newJsonArray.put(jsonArray.getJSONObject(i));
                }
            }
            sharedPreferences.edit().putString(PREF_USER_LIST, newJsonArray.toString()).apply();

            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            keyStore.deleteEntry(KEY_NAME_PREFIX + email);
        } catch (Exception e) {
            // Error during cleanup
        }
    }
    

    private void generateSecretKey(String keyAlias) throws GeneralSecurityException, IOException {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(keyAlias)) {
            keyStore.deleteEntry(keyAlias);
        }

        KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        KeyGenParameterSpec keyGenParameterSpec = new KeyGenParameterSpec.Builder(keyAlias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(true)
                .build();
        keyGenerator.init(keyGenParameterSpec);
        keyGenerator.generateKey();
    }

    private SecretKey getSecretKey(String keyAlias) throws GeneralSecurityException, IOException {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        return (SecretKey) keyStore.getKey(keyAlias, null);
    }



    private static class CipherPair {
        String encryptedData;
        String iv;
        CipherPair(String encryptedData, String iv) {
            this.encryptedData = encryptedData;
            this.iv = iv;
        }
    }

    public void authenticate(FragmentActivity activity, String email, AuthCallback callback) {
        String jsonString = sharedPreferences.getString(PREF_USER_LIST, "[]");

        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            JSONObject userObject = null;

            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject obj = jsonArray.getJSONObject(i);
                if (obj.getString("email").equals(email)) {
                    userObject = obj;
                    break;
                }
            }

            if (userObject == null) {
                callback.onAuthError("No se encontraron datos biométricos para esta cuenta.");
                return;
            }

            String encryptedPassword = userObject.getString("encrypted_password");
            String ivPassword = userObject.getString("iv_password");
            String keyAlias = KEY_NAME_PREFIX + email;
            
            Cipher cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/" + KeyProperties.BLOCK_MODE_CBC + "/" + KeyProperties.ENCRYPTION_PADDING_PKCS7);
            SecretKey secretKey = getSecretKey(keyAlias);
            byte[] ivBytes = Base64.decode(ivPassword, Base64.DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(ivBytes));

            BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);

            BiometricPrompt.PromptInfo promptInfo =
                    new BiometricPrompt.PromptInfo.Builder()
                            .setTitle("Autenticación biométrica")
                            .setSubtitle("Confirma tu identidad para iniciar sesión")
                            .setNegativeButtonText("Cancelar")
                            .build();

            BiometricPrompt biometricPrompt =
                    new BiometricPrompt(activity, ContextCompat.getMainExecutor(context),
                            new BiometricPrompt.AuthenticationCallback() {

                                @Override
                                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                                    super.onAuthenticationSucceeded(result);
                                    try {
                                        Cipher authenticatedCipher = result.getCryptoObject().getCipher();
                                        byte[] decryptedBytes = authenticatedCipher.doFinal(Base64.decode(encryptedPassword, Base64.DEFAULT));
                                        String decryptedPassword = new String(decryptedBytes, StandardCharsets.UTF_8);
                                        callback.onAuthSuccess(email, decryptedPassword);
                                    } catch (Exception e) {
                                        callback.onAuthError("Error al descifrar: " + e.getMessage());
                                    }
                                }

                                @Override
                                public void onAuthenticationError(int errorCode, CharSequence errString) {
                                    super.onAuthenticationError(errorCode, errString);
                                    callback.onAuthError(errString.toString());
                                }
                            });

            biometricPrompt.authenticate(promptInfo, cryptoObject);

        } catch (Exception e) {
            callback.onAuthError("Error interno: " + e.getMessage());
        }
    }

}