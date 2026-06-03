CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  method_type VARCHAR(50) NOT NULL DEFAULT 'ccp',
  name VARCHAR(150) NOT NULL,
  account_holder VARCHAR(150) NULL,
  ccp_number VARCHAR(100) NULL,
  rip_key VARCHAR(100) NULL,
  bank_name VARCHAR(150) NULL,
  phone_number VARCHAR(100) NULL,
  instructions TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_methods_active (is_active),
  INDEX idx_payment_methods_type (method_type)
);

INSERT INTO payment_methods (
  method_type,
  name,
  account_holder,
  ccp_number,
  rip_key,
  bank_name,
  phone_number,
  instructions,
  is_active,
  sort_order
)
SELECT
  'ccp',
  'Paiement CCP',
  'Nom titulaire CCP',
  '0000000000',
  '00',
  'Algérie Poste',
  '',
  'Envoyez le paiement via CCP puis joignez la preuve PNG/JPG/PDF.',
  1,
  1
WHERE NOT EXISTS (SELECT 1 FROM payment_methods LIMIT 1);
