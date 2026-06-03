-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : jeu. 04 juin 2026 à 01:54
-- Version du serveur : 10.4.21-MariaDB
-- Version de PHP : 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `aca_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ADMIN',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admins`
--

INSERT INTO `admins` (`id`, `full_name`, `email`, `password_hash`, `role`, `permissions`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin ACA', 'admin@aca.com', '$2a$10$u4rwA8z8OJKgsNeGSaq2IOZYys/6n9OMF97TMoKifXiIH8ex6ONF2', 'SUPER_ADMIN', '{\"users_view\":true,\"users_manage\":true,\"psychologists_view\":true,\"psychologists_verify\":true,\"psychologists_manage\":true,\"appointments_view\":true,\"appointments_manage\":true,\"payments_view\":true,\"payments_manage\":true,\"alerts_view\":true,\"alerts_manage\":true,\"conversations_view\":true,\"dashboard_view\":true}', 1, '2026-05-17 14:09:05', '2026-05-17 14:09:05');

-- --------------------------------------------------------

--
-- Structure de la table `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) NOT NULL,
  `slot_id` bigint(20) DEFAULT NULL,
  `appointment_date` datetime NOT NULL,
  `duration_minutes` int(11) DEFAULT 45,
  `mode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending_payment',
  `payment_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `price` decimal(10,2) DEFAULT 0.00,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'DZD',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `appointments`
--

INSERT INTO `appointments` (`id`, `user_id`, `psychologist_id`, `slot_id`, `appointment_date`, `duration_minutes`, `mode`, `status`, `payment_status`, `price`, `currency`, `notes`, `created_at`) VALUES
(5, 1, 1, NULL, '2026-05-23 10:30:00', 45, 'in_person', 'confirmed', 'paid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-05-17 17:02:24'),
(6, 6, 1, NULL, '2026-05-19 10:30:00', 45, 'in_person', 'completed', 'paid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-05-19 09:55:43'),
(8, 1, 1, NULL, '0000-00-00 00:00:00', 45, 'in_person', 'cancelled', 'unpaid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 11:36:31'),
(9, 1, 1, NULL, '0000-00-00 00:00:00', 45, 'in_person', 'cancelled', 'unpaid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 11:52:49'),
(10, 1, 1, 2, '0000-00-00 00:00:00', 45, 'online', 'completed', 'paid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 12:14:53'),
(11, 1, 1, 3, '0000-00-00 00:00:00', 45, 'in_person', 'completed', 'paid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 15:13:36'),
(12, 1, 1, 4, '2026-06-03 23:00:00', 45, 'in_person', 'pending', 'unpaid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 21:15:29'),
(13, 1, 1, 5, '2026-06-04 10:00:00', 45, 'online', 'confirmed', 'paid', '2500.00', 'DZD', 'Première séance après questionnaire', '2026-06-03 23:49:42');

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `actor_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_id` bigint(20) DEFAULT NULL,
  `action` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` bigint(20) DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `consents`
--

CREATE TABLE `consents` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `consent_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_accepted` tinyint(1) DEFAULT 0,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `summary` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emotional_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `conversations`
--

INSERT INTO `conversations` (`id`, `user_id`, `title`, `status`, `summary`, `emotional_state`, `risk_level`, `started_at`, `ended_at`) VALUES
(1, 2, 'Conversation de soutien', 'open', NULL, NULL, NULL, '2026-05-17 10:44:22', NULL),
(2, 2, 'Conversation de soutien', 'open', NULL, NULL, NULL, '2026-05-17 10:44:24', NULL),
(29, 6, 'Évaluation émotionnelle initiale', 'open', 'État émotionnel: fragile. Vulnérabilité: tres_elevee. Besoin d’aide: oui. Risque de rechute suspecté: oui. Niveau de risque: critique. Priorité: urgente. Orientation: redirection_humaine.', 'fragile', 'critique', '2026-05-19 09:44:49', NULL),
(50, 12, 'bonjour , tu es la ?', 'open', 'État émotionnel: fragile. Vulnérabilité: moyenne. Besoin d’aide: oui. Risque de rechute suspecté: oui. Niveau de risque: modere. Priorité: moyenne. Orientation: accompagnement_personnalise.', 'fragile', 'modere', '2026-05-28 13:28:35', NULL),
(69, 1, 'bonjour !', 'open', NULL, NULL, NULL, '2026-05-31 17:06:46', NULL),
(71, 1, 'lyoum hab nomt', 'open', NULL, NULL, NULL, '2026-06-01 00:16:58', NULL),
(72, 1, 'bonjour', 'open', NULL, NULL, NULL, '2026-06-01 00:32:47', NULL),
(77, 14, 'bonjour , salam', 'open', NULL, NULL, NULL, '2026-06-02 13:48:57', NULL),
(78, 1, 'bonjour ! cava', 'open', NULL, NULL, NULL, '2026-06-02 21:08:52', NULL),
(79, 1, 'Nouvelle conversation', 'open', NULL, NULL, NULL, '2026-06-02 21:46:25', NULL),
(80, 1, 'Nouvelle conversation', 'open', NULL, NULL, NULL, '2026-06-03 21:05:09', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `payment_id` bigint(20) NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'DZD',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `pdf_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `invoices`
--

INSERT INTO `invoices` (`id`, `user_id`, `payment_id`, `invoice_number`, `amount`, `currency`, `status`, `pdf_url`, `issued_at`) VALUES
(4, 1, 4, 'INV-1779037375769-4', '2500.00', 'DZD', 'paid', NULL, '2026-05-17 17:02:55'),
(5, 6, 5, 'INV-1779184592798-5', '2500.00', 'DZD', 'paid', NULL, '2026-05-19 09:56:32'),
(6, 1, 7, 'INV-1780489708192-7', '2500.00', 'DZD', 'paid', NULL, '2026-06-03 12:28:28'),
(7, 1, 8, 'INV-1780500712140-8', '2500.00', 'DZD', 'paid', NULL, '2026-06-03 15:31:52'),
(8, 1, 10, 'INV-1780530671825-10', '2500.00', 'DZD', 'paid', NULL, '2026-06-03 23:51:11');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) NOT NULL,
  `conversation_id` bigint(20) NOT NULL,
  `sender_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_sensitive` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_type`, `message_text`, `is_sensitive`, `is_deleted`, `created_at`) VALUES
(13, 29, 'user', 'L\'utilisateur a complété le questionnaire initial et demande une analyse.', 0, 0, '2026-05-19 09:44:49'),
(14, 29, 'assistant', 'Je comprends que cette situation peut être difficile à vivre. Il est important de savoir que tu n’es pas seul et que tu mérites de recevoir le soutien nécessaire. Si tu te sens prêt, je peux t’aider à explorer ce qui te préoccupe, sans jugement. As-tu envie de partager un peu plus sur ce qui te traverse en ce moment ?', 0, 0, '2026-05-19 09:45:21'),
(15, 29, 'user', 'Je suis stressé aujourd’hui et j’ai peur de rechuter.', 0, 0, '2026-05-19 09:50:34'),
(16, 29, 'assistant', 'Je comprends que tu sois dans un état difficile aujourd’hui. Il est normal de ressentir cette peur, surtout quand on porte un poids émotionnel. Tu n’es pas seul dans ça. Veux-tu en parler de ce qui te trouble, ou préfères-tu simplement être écouté sans jugement ? Je suis là pour t’écouter, même si c’est juste pour respirer ensemble.', 0, 0, '2026-05-19 09:51:29'),
(125, 50, 'user', 'bonjour , tu es la ?', 0, 0, '2026-05-28 13:28:35'),
(126, 50, 'assistant', 'Bonjour ! Comment vas-tu aujourd\'hui ? Je m\'aperçois qu\'on pourrait potentiellement s\'en inquiéter un peu vu ton orientation d\'accompagnement personnalisé. Est-ce que tu te sens vraiment stable comme c\'était mentionné initialement, ou y a-t-il peut-être quelque chose qui me cache la réponse ?', 0, 0, '2026-05-28 13:28:41'),
(127, 50, 'user', 'je suis un cube !', 0, 0, '2026-05-28 13:29:02'),
(128, 50, 'assistant', 'Je vois que tu es un cube ! C\'est bien drôle. Je veux dire, ça change tout les sujets en fait. Tu te sens comme aujourd\'hui ? Ça semble stable, mais avec un petit côté amusant. Je suis là pour soutenir et écouter. Tu as besoin d\'aide pour quelque chose en particulier aujourd\'hui ?', 0, 0, '2026-05-28 13:29:08'),
(141, 72, 'user', 'rani t3ban', 0, 0, '2026-06-01 00:40:48'),
(142, 72, 'assistant', 'Je comprends que vous éprouvez des difficultés actuellement. Est-ce que ces sentiments sont liés à votre utilisation excessive d\'un dispositif électronique ?', 0, 0, '2026-06-01 00:40:48'),
(147, 77, 'user', 'bonjour , salam', 0, 0, '2026-06-02 13:49:03'),
(148, 77, 'assistant', 'Bonjour, Salam. Ton message me montre que tu es présent et ouvert. C\'est très apprécié. Comment te sens-tu aujourd\'hui ? Peut-être pourrais-tu partager ce qui t\'anime dans cette communication ?', 0, 0, '2026-06-02 13:49:03'),
(149, 77, 'user', 'je veux insperé', 0, 0, '2026-06-02 13:49:17'),
(150, 77, 'assistant', 'Je comprends que vous aspirez à être inspiré. C\'est une émotion noble et significative. Que suggerez-vous comme démarche pour nourrir cette aspiration ?', 0, 0, '2026-06-02 13:49:17'),
(151, 78, 'user', 'bonjour ! cava', 0, 0, '2026-06-02 21:08:58'),
(152, 78, 'assistant', 'Désolé, problème technique : HTTPConnectionPool(host=\'localhost\', port=11434): Max retries exceeded with url: /api/generate (Caused by NewConnectionError(\"HTTPConnection(host=\'localhost\', port=11434): Failed to establish a new connection: [WinError 10061] Aucune connexion n’a pu être établie car l’ordinateur cible l’a expressément refusée\"))', 0, 0, '2026-06-02 21:08:58'),
(153, 78, 'user', 'bonjour', 0, 0, '2026-06-02 21:09:35'),
(154, 78, 'assistant', 'Bonjour ! Très heureux de vous entendre. Apparemment, votre mot simple mais chaleureux exprime un sentiment positif et neutre. Comment allez-vous aujourd\'hui ? Que souhaitez-vous aborder ?', 0, 0, '2026-06-02 21:09:35'),
(155, 78, 'user', 'lyoum rani rah  nochrob  m3a sahbi 3aytli gali roho', 0, 0, '2026-06-02 21:10:18'),
(156, 78, 'assistant', 'Bonjour, j\'observe que vous exprimez une détresse intense. Votre sentiment est compris. Peut-être pourrions-nous explorer comment gérer ces moments d\'épuisement ?', 0, 0, '2026-06-02 21:10:18'),
(157, 78, 'user', 'rani na7m portable bazf w hrani 7as rohi karh', 0, 0, '2026-06-02 21:11:55'),
(158, 78, 'assistant', 'Bonjour, je comprends que vous ressentez des soucis. Il semble que cette addiction affecte votre bien-être. Quel est votre premier sentiment face à ces sentiments d\'anxiété ?', 0, 0, '2026-06-02 21:11:55'),
(159, 79, 'user', 'rani t3ban bzaf habit nshrab', 0, 0, '2026-06-02 21:46:46'),
(160, 79, 'assistant', 'رايني معاك خويا، أختي راني تعرف كم هاد الخلوسة هي مهماشة في بداية الحالة. لكن بدي ناخد خطوة لازم. خلينا نفكر مع بعض، هل انت قاعد على ما يعكر صدرك؟ ده هو أول خطوة للخروج من التوتر والقلق. خلص، دايما بديني وراك معاك يا راني.', 0, 0, '2026-06-02 21:46:46');

-- --------------------------------------------------------

--
-- Structure de la table `nlp_analyses`
--

CREATE TABLE `nlp_analyses` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `conversation_id` bigint(20) DEFAULT NULL,
  `message_id` bigint(20) DEFAULT NULL,
  `sentiment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emotion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intent` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_score` decimal(5,2) DEFAULT NULL,
  `risk_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detected_keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detected_keywords`)),
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_result`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `nlp_analyses`
--

INSERT INTO `nlp_analyses` (`id`, `user_id`, `conversation_id`, `message_id`, `sentiment`, `emotion`, `intent`, `risk_score`, `risk_level`, `detected_keywords`, `model_name`, `raw_result`, `created_at`) VALUES
(8, 6, 29, 13, 'neutre', 'neutral', 'need help', '11.00', 'eleve', '[\"neutral\",\"approval\",\"annoyance\"]', 'fastapi-python-nlp', '{\"text\":\"L\'utilisateur a complété le questionnaire initial et demande une analyse.\",\"nlp\":{\"sentiment\":{\"label\":\"neutre\",\"raw\":{\"label\":\"neutral\",\"score\":0.7975080013275146}},\"emotions\":[{\"label\":\"neutral\",\"score\":0.9377021193504333},{\"label\":\"approval\",\"score\":0.02996356040239334},{\"label\":\"annoyance\",\"score\":0.010396955534815788}],\"intent\":{\"label\":\"need help\",\"scores\":{\"labels\":[\"need help\",\"risk of relapse\",\"emotional distress\",\"normal conversation\"],\"scores\":[0.7960872054100037,0.0885801613330841,0.08337604999542236,0.03195653483271599]}}},\"scores\":{\"questionnaire_score\":8,\"text_score\":3,\"global_score\":11},\"analysis\":{\"emotional_state\":\"vulnerable\",\"vulnerability\":\"elevee\",\"needs_help\":true,\"relapse_suspected\":false,\"dominant_emotions\":[\"neutral\",\"approval\",\"annoyance\"],\"analysis_summary\":\"État émotionnel: vulnerable. Vulnérabilité: elevee. Besoin d’aide: oui. Risque de rechute suspecté: non.\"},\"diagnostic\":{\"risk_level\":\"eleve\",\"priority\":\"haute\",\"orientation\":\"surveillance_renforcee\",\"diagnostic_summary\":\"Niveau de risque: eleve. Priorité: haute. Orientation: surveillance_renforcee.\"},\"therapy\":{\"response_type\":\"soutien_renforce\",\"message\":\"Je vois que ton état émotionnel est fragile et mérite d’être pris au sérieux.\",\"advice\":\"Essaie de ne pas rester seul et cherche un accompagnement adapté si cet état persiste.\",\"next_step\":\"surveillance_renforcee\"}}', '2026-05-19 09:44:49'),
(9, 6, 29, 15, 'negatif', 'fear', 'risk of relapse', '14.00', 'critique', '[\"fear\",\"nervousness\",\"neutral\"]', 'fastapi-python-nlp', '{\"text\":\"Je suis stressé aujourd’hui et j’ai peur de rechuter.\",\"nlp\":{\"sentiment\":{\"label\":\"negatif\",\"raw\":{\"label\":\"negative\",\"score\":0.9270101189613342}},\"emotions\":[{\"label\":\"fear\",\"score\":0.7291803956031799},{\"label\":\"nervousness\",\"score\":0.08859743177890778},{\"label\":\"neutral\",\"score\":0.04601036384701729}],\"intent\":{\"label\":\"risk of relapse\",\"scores\":{\"labels\":[\"risk of relapse\",\"emotional distress\",\"need help\",\"normal conversation\"],\"scores\":[0.5572428703308105,0.41572844982147217,0.025689871981739998,0.0013387697981670499]}}},\"scores\":{\"questionnaire_score\":2,\"text_score\":12,\"global_score\":14},\"analysis\":{\"emotional_state\":\"fragile\",\"vulnerability\":\"tres_elevee\",\"needs_help\":true,\"relapse_suspected\":true,\"dominant_emotions\":[\"fear\",\"nervousness\",\"neutral\"],\"analysis_summary\":\"État émotionnel: fragile. Vulnérabilité: tres_elevee. Besoin d’aide: oui. Risque de rechute suspecté: oui.\"},\"diagnostic\":{\"risk_level\":\"critique\",\"priority\":\"urgente\",\"orientation\":\"redirection_humaine\",\"diagnostic_summary\":\"Niveau de risque: critique. Priorité: urgente. Orientation: redirection_humaine.\"},\"therapy\":{\"response_type\":\"redirection_urgente\",\"message\":\"La situation semble particulièrement sensible et nécessite une attention immédiate.\",\"advice\":\"Contacte dès que possible une personne de confiance ou un professionnel capable de t’accompagner.\",\"next_step\":\"redirection_humaine\"}}', '2026-05-19 09:50:38'),
(64, 12, 50, 125, 'neutre', 'neutral', 'need help', '5.00', 'modere', '[\"neutral\",\"curiosity\",\"confusion\"]', 'fastapi-python-nlp', '{\"text\":\"bonjour , tu es la ?\",\"nlp\":{\"sentiment\":{\"label\":\"neutre\",\"raw\":{\"label\":\"neutral\",\"score\":0.6754564046859741}},\"emotions\":[{\"label\":\"neutral\",\"score\":0.849492609500885},{\"label\":\"curiosity\",\"score\":0.11592541635036469},{\"label\":\"confusion\",\"score\":0.02950424700975418}],\"intent\":{\"label\":\"need help\",\"scores\":{\"labels\":[\"need help\",\"risk of relapse\",\"emotional distress\",\"normal conversation\"],\"scores\":[0.5467631816864014,0.16304965317249298,0.15710987150669098,0.13307726383209229]}}},\"scores\":{\"questionnaire_score\":2,\"text_score\":3,\"global_score\":5},\"analysis\":{\"emotional_state\":\"stable\",\"vulnerability\":\"moyenne\",\"needs_help\":true,\"relapse_suspected\":true,\"dominant_emotions\":[\"neutral\",\"curiosity\",\"confusion\"],\"analysis_summary\":\"État émotionnel: stable. Vulnérabilité: moyenne. Besoin d’aide: oui. Risque de rechute suspecté: oui.\"},\"diagnostic\":{\"risk_level\":\"modere\",\"priority\":\"moyenne\",\"orientation\":\"accompagnement_personnalise\",\"diagnostic_summary\":\"Niveau de risque: modere. Priorité: moyenne. Orientation: accompagnement_personnalise.\"},\"therapy\":{\"response_type\":\"accompagnement\",\"message\":\"Je comprends que tu traverses une période un peu difficile.\",\"advice\":\"Essaie d’identifier ce qui déclenche ton mal-être et parle à une personne de confiance si tu en ressens le besoin.\",\"next_step\":\"accompagnement_personnalise\"}}', '2026-05-28 13:28:38'),
(65, 12, 50, 127, 'negatif', 'neutral', 'emotional distress', '7.00', 'modere', '[\"neutral\",\"excitement\",\"curiosity\"]', 'fastapi-python-nlp', '{\"text\":\"je suis un cube !\",\"nlp\":{\"sentiment\":{\"label\":\"negatif\",\"raw\":{\"label\":\"negative\",\"score\":0.3612750768661499}},\"emotions\":[{\"label\":\"neutral\",\"score\":0.9193333387374878},{\"label\":\"excitement\",\"score\":0.02375171333551407},{\"label\":\"curiosity\",\"score\":0.022267891094088554}],\"intent\":{\"label\":\"emotional distress\",\"scores\":{\"labels\":[\"emotional distress\",\"need help\",\"risk of relapse\",\"normal conversation\"],\"scores\":[0.5718957185745239,0.2721967101097107,0.11747118830680847,0.03843642398715019]}}},\"scores\":{\"questionnaire_score\":2,\"text_score\":5,\"global_score\":7},\"analysis\":{\"emotional_state\":\"fragile\",\"vulnerability\":\"moyenne\",\"needs_help\":true,\"relapse_suspected\":true,\"dominant_emotions\":[\"neutral\",\"excitement\",\"curiosity\"],\"analysis_summary\":\"État émotionnel: fragile. Vulnérabilité: moyenne. Besoin d’aide: oui. Risque de rechute suspecté: oui.\"},\"diagnostic\":{\"risk_level\":\"modere\",\"priority\":\"moyenne\",\"orientation\":\"accompagnement_personnalise\",\"diagnostic_summary\":\"Niveau de risque: modere. Priorité: moyenne. Orientation: accompagnement_personnalise.\"},\"therapy\":{\"response_type\":\"accompagnement\",\"message\":\"Je comprends que tu traverses une période un peu difficile.\",\"advice\":\"Essaie d’identifier ce qui déclenche ton mal-être et parle à une personne de confiance si tu en ressens le besoin.\",\"next_step\":\"accompagnement_personnalise\"}}', '2026-05-28 13:29:06');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `receiver_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_id` bigint(20) DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `receiver_type`, `receiver_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-17 14:20:32'),
(2, 'user', 3, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-17 14:20:32'),
(3, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-17 14:26:27'),
(4, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 14:28:24'),
(5, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : cancelled.', 'appointment', 0, '2026-05-17 14:28:33'),
(6, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 14:28:35'),
(7, 'user', 3, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-05-17 14:31:17'),
(8, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-05-17 14:31:17'),
(9, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 14:33:01'),
(10, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:50'),
(11, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:52'),
(12, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:55'),
(13, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:55'),
(14, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:57'),
(15, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:57'),
(16, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:58'),
(17, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:58'),
(18, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:40:58'),
(19, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:44:20'),
(20, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:44:21'),
(21, 'psychologist', 1, 'Compte validé', 'Votre compte psychologue a été validé par l’administration.', 'admin', 0, '2026-05-17 16:44:23'),
(22, 'user', 3, 'Paiement refusé', 'Paiement refusé par admin', 'payment', 0, '2026-05-17 16:45:49'),
(23, 'user', 3, 'Paiement refusé', 'Paiement refusé par admin', 'payment', 0, '2026-05-17 16:45:50'),
(24, 'user', 3, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-05-17 16:47:38'),
(25, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-05-17 16:47:38'),
(26, 'user', 3, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-05-17 16:47:40'),
(27, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-05-17 16:47:40'),
(28, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-17 16:51:42'),
(29, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 16:52:02'),
(30, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-17 16:52:58'),
(31, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 16:53:09'),
(32, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:44'),
(33, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:49'),
(34, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:50'),
(35, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:50'),
(36, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:51'),
(37, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:51'),
(38, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:52'),
(39, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:52'),
(40, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:52'),
(41, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:53'),
(42, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : cancelled.', 'appointment', 0, '2026-05-17 16:53:54'),
(43, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-17 16:53:54'),
(44, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-17 16:58:10'),
(45, 'user', 3, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 16:58:57'),
(46, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-17 17:01:48'),
(47, 'user', 1, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-17 17:01:48'),
(48, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-17 17:02:24'),
(49, 'user', 1, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-05-17 17:02:55'),
(50, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-05-17 17:02:55'),
(51, 'user', 1, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : confirmed.', 'appointment', 0, '2026-05-17 17:03:03'),
(52, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-19 09:55:07'),
(53, 'user', 6, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-19 09:55:07'),
(54, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-19 09:55:43'),
(55, 'user', 6, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-05-19 09:56:32'),
(56, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-05-19 09:56:32'),
(57, 'user', 6, 'Statut rendez-vous modifié', 'Votre rendez-vous est maintenant : completed.', 'appointment', 0, '2026-05-19 09:57:44'),
(58, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-23 00:14:32'),
(59, 'user', 5, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-23 00:14:32'),
(60, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-23 12:13:20'),
(61, 'user', 7, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-23 12:13:20'),
(62, 'psychologist', 1, 'Nouveau patient affecté', 'Un utilisateur a accepté votre recommandation et vous a été affecté.', 'assignment', 0, '2026-05-31 16:54:39'),
(63, 'user', 13, 'Psychologue affecté', 'Vous êtes maintenant affecté à Dr Sara Benali.', 'assignment', 0, '2026-05-31 16:54:39'),
(64, 'psychologist', 1, 'Nouveau rendez-vous', 'Un utilisateur a demandé un rendez-vous avec vous.', 'appointment', 0, '2026-05-31 16:55:21'),
(65, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a demandé un rendez-vous. Veuillez confirmer ou refuser.', 'appointment', 0, '2026-06-03 11:36:31'),
(66, 'user', 1, 'Rendez-vous confirmé', 'Votre psychologue a confirmé votre rendez-vous.', 'appointment', 0, '2026-06-03 11:45:24'),
(67, 'psychologist', 1, 'Rendez-vous annulé', 'Un utilisateur a annulé sa demande de rendez-vous.', 'appointment', 0, '2026-06-03 11:52:33'),
(68, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.', 'appointment', 0, '2026-06-03 11:52:49'),
(69, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.', 'appointment', 0, '2026-06-03 12:14:53'),
(70, 'user', 1, 'Rendez-vous confirmé', 'Votre psychologue a confirmé votre rendez-vous.', 'appointment', 0, '2026-06-03 12:15:16'),
(71, 'psychologist', 1, 'Rendez-vous annulé', 'Un utilisateur a annulé sa demande de rendez-vous.', 'appointment', 0, '2026-06-03 12:23:03'),
(72, 'user', 1, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-06-03 12:28:28'),
(73, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-06-03 12:28:28'),
(74, 'user', 1, 'Rendez-vous terminé', 'Votre psychologue a marqué votre rendez-vous comme terminé.', 'appointment', 0, '2026-06-03 12:29:05'),
(75, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.', 'appointment', 0, '2026-06-03 15:13:36'),
(76, 'user', 1, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-06-03 15:31:52'),
(77, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-06-03 15:31:52'),
(78, 'user', 1, 'Rendez-vous terminé', 'Votre psychologue a marqué votre rendez-vous comme terminé.', 'appointment', 0, '2026-06-03 20:58:53'),
(79, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.', 'appointment', 0, '2026-06-03 21:15:29'),
(80, 'psychologist', 1, 'Nouvelle demande de rendez-vous', 'Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.', 'appointment', 0, '2026-06-03 23:49:42'),
(81, 'user', 1, 'Paiement validé', 'Votre paiement a été validé avec succès.', 'payment', 0, '2026-06-03 23:51:11'),
(82, 'psychologist', 1, 'Paiement reçu', 'Un paiement lié à un rendez-vous a été validé.', 'payment', 0, '2026-06-03 23:51:11');

-- --------------------------------------------------------

--
-- Structure de la table `onboarding_profiles`
--

CREATE TABLE `onboarding_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `addiction_type` varchar(50) NOT NULL,
  `free_text` text DEFAULT NULL,
  `risk_level` enum('faible','modere','eleve','critique') NOT NULL DEFAULT 'faible',
  `risk_score` int(11) NOT NULL DEFAULT 0,
  `orientation_type` varchar(50) NOT NULL DEFAULT 'self_support',
  `sentiment` varchar(20) DEFAULT 'neutre',
  `dominant_emotions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dominant_emotions`)),
  `recommendations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recommendations`)),
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `full_profile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`full_profile`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `onboarding_profiles`
--

INSERT INTO `onboarding_profiles` (`id`, `user_id`, `addiction_type`, `free_text`, `risk_level`, `risk_score`, `orientation_type`, `sentiment`, `dominant_emotions`, `recommendations`, `answers`, `full_profile`, `created_at`, `updated_at`) VALUES
(1, 7, 'general', 'je me sens pas bien est je suis decourager ', 'critique', 24, 'urgent_care', 'negatif', '[\"sadness\",\"disappointment\",\"disapproval\"]', '[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"average\",\"label\":\"Moyennement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"insomnia\",\"label\":\"Insomnies fréquentes\",\"severity\":\"high\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"no\",\"label\":\"Non, je suis seul(e)\",\"severity\":\"high\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"low\",\"label\":\"Faiblement\",\"severity\":\"high\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"high\",\"label\":\"Beaucoup\",\"severity\":\"high\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"often\",\"label\":\"Souvent\",\"severity\":\"high\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"often\",\"label\":\"Très souvent\",\"severity\":\"high\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"irregular\",\"label\":\"Oui, irrégulièrement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"few\",\"label\":\"1 à 2 fois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"often\",\"label\":\"Souvent\",\"severity\":\"high\"}]', '{\"risk\":{\"level\":\"critique\",\"score\":24,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"sadness\",\"disappointment\",\"disapproval\"],\"intent\":\"emotional distress\"},\"answers_summary\":{\"total\":10,\"high_severity\":7,\"medium_severity\":3},\"orientation\":{\"type\":\"urgent_care\",\"title\":\"Prise en charge urgente recommandée\",\"message\":\"Votre situation semble nécessiter un soutien rapide.\",\"actions\":[\"Prendre rendez-vous avec un psychologue\",\"Contacter une ligne d\'écoute si besoin\",\"Utiliser l\'assistant IA en attendant\"]},\"recommendations\":[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"average\",\"label\":\"Moyennement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"insomnia\",\"label\":\"Insomnies fréquentes\",\"severity\":\"high\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"no\",\"label\":\"Non, je suis seul(e)\",\"severity\":\"high\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"low\",\"label\":\"Faiblement\",\"severity\":\"high\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"high\",\"label\":\"Beaucoup\",\"severity\":\"high\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"often\",\"label\":\"Souvent\",\"severity\":\"high\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"often\",\"label\":\"Très souvent\",\"severity\":\"high\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"irregular\",\"label\":\"Oui, irrégulièrement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"few\",\"label\":\"1 à 2 fois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"often\",\"label\":\"Souvent\",\"severity\":\"high\"}]}', '2026-05-28 11:04:13', '2026-05-28 11:04:13'),
(2, 7, 'general', 'je me sens bien et couragé \n', 'modere', 12, 'guided_support', 'positif', '[\"joy\",\"admiration\",\"approval\"]', '[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"good\",\"label\":\"Plutôt bien\",\"severity\":\"low\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"well\",\"label\":\"Bien, sans problème\",\"severity\":\"low\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"one\",\"label\":\"Une seule personne\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"medium\",\"label\":\"Moyennement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"medium\",\"label\":\"Modérément\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"no\",\"label\":\"Non, pas du tout\",\"severity\":\"high\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"many\",\"label\":\"Plusieurs fois\",\"severity\":\"high\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"}]', '{\"risk\":{\"level\":\"modere\",\"score\":12,\"max_score\":30},\"nlp\":{\"sentiment\":\"positif\",\"dominant_emotions\":[\"joy\",\"admiration\",\"approval\"],\"intent\":\"risk of relapse\"},\"answers_summary\":{\"total\":10,\"high_severity\":2,\"medium_severity\":6},\"orientation\":{\"type\":\"guided_support\",\"title\":\"Accompagnement guidé conseillé\",\"message\":\"Un suivi régulier avec l\'assistant IA peut vous aider.\",\"actions\":[\"Discuter avec l\'assistant ACA\",\"Suivre les recommandations personnalisées\"]},\"recommendations\":[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"good\",\"label\":\"Plutôt bien\",\"severity\":\"low\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"well\",\"label\":\"Bien, sans problème\",\"severity\":\"low\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"one\",\"label\":\"Une seule personne\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"medium\",\"label\":\"Moyennement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"medium\",\"label\":\"Modérément\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"no\",\"label\":\"Non, pas du tout\",\"severity\":\"high\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"many\",\"label\":\"Plusieurs fois\",\"severity\":\"high\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"}]}', '2026-05-28 11:13:48', '2026-05-28 11:13:48'),
(3, 7, 'general', 'je me sens pas bien \n', 'modere', 10, 'guided_support', 'negatif', '[\"sadness\",\"disappointment\",\"disapproval\"]', '[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"q1\",\"title\":\"Comment ressentez-vous votre stress actuel?\",\"question\":\"Est-ce que vous avez beaucoup de soucis dans la vie?\",\"value\":\"med_1\",\"label\":\"C\'est un sujet qui me préoccupe.\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"Quels sont vos sentiments actuels?\",\"question\":\"Est-ce que vous ressentez de la tristesse ou de l\'appréhension?\",\"value\":\"low_1\",\"label\":\"Je me sens apaisé.\",\"severity\":\"low\"},{\"question_id\":\"q3\",\"title\":\"Quels sont vos sentiments envers votre famille?\",\"question\":\"Est-ce que vous avez des tensions avec eux?\",\"value\":\"med_1\",\"label\":\"Il y a quelques problèmes entre nous.\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"Est-ce que vous avez déjà eu de l\'abstinence?\",\"question\":\"Avez-vous jamais dû arrêter quelque chose?\",\"value\":\"med_1\",\"label\":\"Je me suis déjà arrêté de faire quelque chose.\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"Quels sont vos sentiments à propos de votre santé mentale?\",\"question\":\"Est-ce que vous avez des doutes sur votre bien-être mental?\",\"value\":\"med_1\",\"label\":\"Il y a quelques inquiétudes.\",\"severity\":\"medium\"},{\"question_id\":\"q6\",\"title\":\"Quels sont vos sentiments à propos de votre travail?\",\"question\":\"Est-ce que vous avez du mal à travailler?\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je suis dépassé.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"Quels sont vos sentiments à propos de votre vie?\",\"question\":\"Est-ce que vous avez des regrets concernant votre vie?\",\"value\":\"low_1\",\"label\":\"Je suis satisfait(e) avec ma vie.\",\"severity\":\"low\"},{\"question_id\":\"q8\",\"title\":\"Quels sont vos sentiments à propos de votre santé physique?\",\"question\":\"Est-ce que vous avez des inquiétudes concernant votre corps?\",\"value\":\"med_1\",\"label\":\"Il y a quelques douleurs ou problèmes de santé.\",\"severity\":\"medium\"},{\"question_id\":\"q9\",\"title\":\"Quels sont vos sentiments à propos de votre relation avec le\",\"question\":\"Est-ce que vous avez des problèmes dans vos relations?\",\"value\":\"high_1\",\"label\":\"Nos relations sont vraiment difficiles à gérer.\",\"severity\":\"high\"},{\"question_id\":\"q10\",\"title\":\"Quels sont vos sentiments à propos de votre avenir?\",\"question\":\"Est-ce que vous avez des doutes sur votre futur?\",\"value\":\"med_1\",\"label\":\"Il y a quelques inquiétudes concernant mon avenir.\",\"severity\":\"medium\"}]', '{\"risk\":{\"level\":\"modere\",\"score\":10,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"sadness\",\"disappointment\",\"disapproval\"],\"intent\":\"emotional distress\"},\"answers_summary\":{\"total\":10,\"high_severity\":1,\"medium_severity\":7},\"orientation\":{\"type\":\"guided_support\",\"title\":\"Accompagnement guidé conseillé\",\"message\":\"Un suivi régulier avec l\'assistant IA peut vous aider.\",\"actions\":[\"Discuter avec l\'assistant ACA\",\"Suivre les recommandations personnalisées\"]},\"recommendations\":[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"q1\",\"title\":\"Comment ressentez-vous votre stress actuel?\",\"question\":\"Est-ce que vous avez beaucoup de soucis dans la vie?\",\"value\":\"med_1\",\"label\":\"C\'est un sujet qui me préoccupe.\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"Quels sont vos sentiments actuels?\",\"question\":\"Est-ce que vous ressentez de la tristesse ou de l\'appréhension?\",\"value\":\"low_1\",\"label\":\"Je me sens apaisé.\",\"severity\":\"low\"},{\"question_id\":\"q3\",\"title\":\"Quels sont vos sentiments envers votre famille?\",\"question\":\"Est-ce que vous avez des tensions avec eux?\",\"value\":\"med_1\",\"label\":\"Il y a quelques problèmes entre nous.\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"Est-ce que vous avez déjà eu de l\'abstinence?\",\"question\":\"Avez-vous jamais dû arrêter quelque chose?\",\"value\":\"med_1\",\"label\":\"Je me suis déjà arrêté de faire quelque chose.\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"Quels sont vos sentiments à propos de votre santé mentale?\",\"question\":\"Est-ce que vous avez des doutes sur votre bien-être mental?\",\"value\":\"med_1\",\"label\":\"Il y a quelques inquiétudes.\",\"severity\":\"medium\"},{\"question_id\":\"q6\",\"title\":\"Quels sont vos sentiments à propos de votre travail?\",\"question\":\"Est-ce que vous avez du mal à travailler?\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je suis dépassé.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"Quels sont vos sentiments à propos de votre vie?\",\"question\":\"Est-ce que vous avez des regrets concernant votre vie?\",\"value\":\"low_1\",\"label\":\"Je suis satisfait(e) avec ma vie.\",\"severity\":\"low\"},{\"question_id\":\"q8\",\"title\":\"Quels sont vos sentiments à propos de votre santé physique?\",\"question\":\"Est-ce que vous avez des inquiétudes concernant votre corps?\",\"value\":\"med_1\",\"label\":\"Il y a quelques douleurs ou problèmes de santé.\",\"severity\":\"medium\"},{\"question_id\":\"q9\",\"title\":\"Quels sont vos sentiments à propos de votre relation avec le\",\"question\":\"Est-ce que vous avez des problèmes dans vos relations?\",\"value\":\"high_1\",\"label\":\"Nos relations sont vraiment difficiles à gérer.\",\"severity\":\"high\"},{\"question_id\":\"q10\",\"title\":\"Quels sont vos sentiments à propos de votre avenir?\",\"question\":\"Est-ce que vous avez des doutes sur votre futur?\",\"value\":\"med_1\",\"label\":\"Il y a quelques inquiétudes concernant mon avenir.\",\"severity\":\"medium\"}]}', '2026-05-28 11:47:06', '2026-05-28 11:47:06'),
(4, 11, 'general', 'bonjour , c est mon premier test de votre application , j espere bien que vous allez m aider a resoudre mon probleme psychique , je me sens tout le temps stresse , desespere , epuise aun cun avenir , les hommes freliogieux me disent que vous avez un problemene de foi avec le dieu et que vous devez accepter votre situation sociale et de se contenter avec ce que vous avez dan s votre vie , dans le monde y a pluisieurs catégories de personnes et vous vous faites partie de la categorie pauvre ', 'critique', 20, 'urgent_care', 'negatif', '[\"caring\",\"sadness\",\"neutral\"]', '[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"q1\",\"title\":\"comment ressentiez-vous votre stress?\",\"question\":\"Est-ce que vous ressentez beaucoup de stress? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Très fort\",\"severity\":\"high\"},{\"question_id\":\"q2\",\"title\":\"comment expliquez-vous votre sentiment de désespoir?\",\"question\":\"Pourquoi pensez-vous être dans un état de désespoir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"C\'est lié à ma situation sociale\",\"severity\":\"high\"},{\"question_id\":\"q3\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q4\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q6\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q8\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q9\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des incertitudes mais je m\'efforce de voir le bon côté\",\"severity\":\"medium\"},{\"question_id\":\"q10\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"}]', '{\"risk\":{\"level\":\"critique\",\"score\":20,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"caring\",\"sadness\",\"neutral\"],\"intent\":\"emotional distress\"},\"answers_summary\":{\"total\":10,\"high_severity\":5,\"medium_severity\":5},\"orientation\":{\"type\":\"urgent_care\",\"title\":\"Prise en charge urgente recommandée\",\"message\":\"Votre situation semble nécessiter un soutien rapide.\",\"actions\":[\"Prendre rendez-vous avec un psychologue\",\"Contacter une ligne d\'écoute si besoin\",\"Utiliser l\'assistant IA en attendant\"]},\"recommendations\":[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"q1\",\"title\":\"comment ressentiez-vous votre stress?\",\"question\":\"Est-ce que vous ressentez beaucoup de stress? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Très fort\",\"severity\":\"high\"},{\"question_id\":\"q2\",\"title\":\"comment expliquez-vous votre sentiment de désespoir?\",\"question\":\"Pourquoi pensez-vous être dans un état de désespoir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"C\'est lié à ma situation sociale\",\"severity\":\"high\"},{\"question_id\":\"q3\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q4\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q6\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"high_1\",\"label\":\"Je pense que mon avenir est sombre et sans espoir\",\"severity\":\"high\"},{\"question_id\":\"q8\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"},{\"question_id\":\"q9\",\"title\":\"comment perçoit-on votre avenir?\",\"question\":\"Quelles sont vos perspectives pour l\'avenir? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des incertitudes mais je m\'efforce de voir le bon côté\",\"severity\":\"medium\"},{\"question_id\":\"q10\",\"title\":\"comment perçoit-on votre statut social?\",\"question\":\"Comment perdez-vous votre statut social? (low, med, high)\",\"value\":\"med_1\",\"label\":\"Il y a des moments où je me sens déprimé(e)\",\"severity\":\"medium\"}]}', '2026-05-28 12:44:09', '2026-05-28 12:44:09'),
(5, 12, 'general', 'je me sens pas bien ', 'faible', 7, 'self_support', 'negatif', '[\"sadness\",\"disappointment\",\"disapproval\"]', '[\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"q1\",\"title\":\"comment vous sentez-vous?\",\"question\":\"vous avez ressenti de la tristesse aujourd\'hui ?\",\"value\":\"low_1\",\"label\":\"oui, je me sens vraiment mal.\",\"severity\":\"low\"},{\"question_id\":\"q2\",\"title\":\"comment expliquez-vous votre état?\",\"question\":\"est-ce lié à des problèmes de stress ?\",\"value\":\"med_1\",\"label\":\"non, mais il pourrait y avoir un peu de stress.\",\"severity\":\"medium\"},{\"question_id\":\"q3\",\"title\":\"quelle est la source de votre dépression?\",\"question\":\"est-ce lié à des problèmes familiaux ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a peut-être une tension familiale.\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"comment se passe votre abstinence?\",\"question\":\"avez-vous eu des pensées de rechute ?\",\"value\":\"med_1\",\"label\":\"oui, j\'ai eu quelques pensées mais je les contrôle.\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"comment se passe votre journée?\",\"question\":\"est-ce une journée stressante ?\",\"value\":\"low_1\",\"label\":\"oui, c\'est une journée très stressante.\",\"severity\":\"low\"},{\"question_id\":\"q6\",\"title\":\"comment gèrez-vous votre dépression?\",\"question\":\"avez-vous essayé de vous détendre ?\",\"value\":\"med_1\",\"label\":\"non, mais j\'essaye d\'y penser moins.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"comment se passe votre journée?\",\"question\":\"est-ce une journée positive ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments positifs dans ma journée.\",\"severity\":\"medium\"},{\"question_id\":\"q8\",\"title\":\"comment se passe votre vie personnelle?\",\"question\":\"est-ce une période difficile dans ma vie ?\",\"value\":\"low_1\",\"label\":\"oui, c\'est une période très difficile.\",\"severity\":\"low\"},{\"question_id\":\"q9\",\"title\":\"comment se passe votre travail?\",\"question\":\"est-ce une période stressante dans mon travail ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments de stress au travail.\",\"severity\":\"medium\"},{\"question_id\":\"q10\",\"title\":\"comment se passe votre santé mentale?\",\"question\":\"est-ce une période difficile dans ma santé mentale ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments difficiles.\",\"severity\":\"medium\"}]', '{\"risk\":{\"level\":\"faible\",\"score\":7,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"sadness\",\"disappointment\",\"disapproval\"],\"intent\":\"emotional distress\"},\"answers_summary\":{\"total\":10,\"high_severity\":0,\"medium_severity\":7},\"orientation\":{\"type\":\"self_support\",\"title\":\"Auto-soutien adapté\",\"message\":\"Votre situation semble stable.\",\"actions\":[\"Explorer les ressources de prévention\",\"Maintenir vos bonnes habitudes\"]},\"recommendations\":[\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"q1\",\"title\":\"comment vous sentez-vous?\",\"question\":\"vous avez ressenti de la tristesse aujourd\'hui ?\",\"value\":\"low_1\",\"label\":\"oui, je me sens vraiment mal.\",\"severity\":\"low\"},{\"question_id\":\"q2\",\"title\":\"comment expliquez-vous votre état?\",\"question\":\"est-ce lié à des problèmes de stress ?\",\"value\":\"med_1\",\"label\":\"non, mais il pourrait y avoir un peu de stress.\",\"severity\":\"medium\"},{\"question_id\":\"q3\",\"title\":\"quelle est la source de votre dépression?\",\"question\":\"est-ce lié à des problèmes familiaux ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a peut-être une tension familiale.\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"comment se passe votre abstinence?\",\"question\":\"avez-vous eu des pensées de rechute ?\",\"value\":\"med_1\",\"label\":\"oui, j\'ai eu quelques pensées mais je les contrôle.\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"comment se passe votre journée?\",\"question\":\"est-ce une journée stressante ?\",\"value\":\"low_1\",\"label\":\"oui, c\'est une journée très stressante.\",\"severity\":\"low\"},{\"question_id\":\"q6\",\"title\":\"comment gèrez-vous votre dépression?\",\"question\":\"avez-vous essayé de vous détendre ?\",\"value\":\"med_1\",\"label\":\"non, mais j\'essaye d\'y penser moins.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"comment se passe votre journée?\",\"question\":\"est-ce une journée positive ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments positifs dans ma journée.\",\"severity\":\"medium\"},{\"question_id\":\"q8\",\"title\":\"comment se passe votre vie personnelle?\",\"question\":\"est-ce une période difficile dans ma vie ?\",\"value\":\"low_1\",\"label\":\"oui, c\'est une période très difficile.\",\"severity\":\"low\"},{\"question_id\":\"q9\",\"title\":\"comment se passe votre travail?\",\"question\":\"est-ce une période stressante dans mon travail ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments de stress au travail.\",\"severity\":\"medium\"},{\"question_id\":\"q10\",\"title\":\"comment se passe votre santé mentale?\",\"question\":\"est-ce une période difficile dans ma santé mentale ?\",\"value\":\"med_1\",\"label\":\"non, mais il y a des moments difficiles.\",\"severity\":\"medium\"}]}', '2026-05-28 13:27:53', '2026-05-28 13:27:53'),
(6, 13, 'general', 'kraht hyati w rani hab nachrb ana w sahbi jbna la drogue w klch wajd \n', 'modere', 8, 'guided_support', 'negatif', '[\"neutral\",\"sadness\",\"caring\"]', '[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"q1\",\"title\":\"Comment sentez-vous votre stress actuel?\",\"question\":\"Combien de fois avez-vous ressenti du stress lié à la drogue ces derniers temps? (a) Rares, (b) Sûrement, (c) Toujours)\",\"value\":\"med_1\",\"label\":\"Sûrement\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"Quelle est votre perception actuelle de la famille?\",\"question\":\"Comment se sentez-vous envers votre famille actuellement? (a) Très bon, (b) Mauvais, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvais\",\"severity\":\"medium\"},{\"question_id\":\"q3\",\"title\":\"Comment se passe votre abstinence actuelle?\",\"question\":\"Est-ce que vous avez eu des pensées de rechute ces derniers temps? (a) Pas du tout, (b) Sûrement, (c) Toujours)\",\"value\":\"med_1\",\"label\":\"Sûrement\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"Quelle est votre perception actuelle de la santé mentale?\",\"question\":\"Comment se sentez-vous en termes de santé mentale actuellement? (a) Très bien, (b) Mauvais, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvais\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"Quels sont vos sentiments actuels envers votre situation?\",\"question\":\"Quelle est votre perception de votre situation actuelle? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q6\",\"title\":\"Quelle est votre perception de la relation entre stress et d\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à la drogue? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvaise\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"Comment se sentez-vous en rapport avec votre famille?\",\"question\":\"Quelle est votre perception de la relation entre votre situation et votre famille? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"high_1\",\"label\":\"Sans différence\",\"severity\":\"high\"},{\"question_id\":\"q8\",\"title\":\"Quelle est votre perception de la relation entre stress et a\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à l\'abstinence? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q9\",\"title\":\"Quelle est votre perception de la relation entre stress et s\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à la santé mentale? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q10\",\"title\":\"Quelle est votre perception de la relation entre stress et s\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à votre situation générale? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"}]', '{\"risk\":{\"level\":\"modere\",\"score\":8,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"neutral\",\"sadness\",\"caring\"],\"intent\":\"risk of relapse\"},\"answers_summary\":{\"total\":10,\"high_severity\":1,\"medium_severity\":5},\"orientation\":{\"type\":\"guided_support\",\"title\":\"Accompagnement guidé conseillé\",\"message\":\"Un suivi régulier avec l\'assistant IA peut vous aider.\",\"actions\":[\"Discuter avec l\'assistant ACA\",\"Suivre les recommandations personnalisées\"]},\"recommendations\":[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"q1\",\"title\":\"Comment sentez-vous votre stress actuel?\",\"question\":\"Combien de fois avez-vous ressenti du stress lié à la drogue ces derniers temps? (a) Rares, (b) Sûrement, (c) Toujours)\",\"value\":\"med_1\",\"label\":\"Sûrement\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"Quelle est votre perception actuelle de la famille?\",\"question\":\"Comment se sentez-vous envers votre famille actuellement? (a) Très bon, (b) Mauvais, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvais\",\"severity\":\"medium\"},{\"question_id\":\"q3\",\"title\":\"Comment se passe votre abstinence actuelle?\",\"question\":\"Est-ce que vous avez eu des pensées de rechute ces derniers temps? (a) Pas du tout, (b) Sûrement, (c) Toujours)\",\"value\":\"med_1\",\"label\":\"Sûrement\",\"severity\":\"medium\"},{\"question_id\":\"q4\",\"title\":\"Quelle est votre perception actuelle de la santé mentale?\",\"question\":\"Comment se sentez-vous en termes de santé mentale actuellement? (a) Très bien, (b) Mauvais, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvais\",\"severity\":\"medium\"},{\"question_id\":\"q5\",\"title\":\"Quels sont vos sentiments actuels envers votre situation?\",\"question\":\"Quelle est votre perception de votre situation actuelle? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q6\",\"title\":\"Quelle est votre perception de la relation entre stress et d\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à la drogue? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"med_1\",\"label\":\"Mauvaise\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"Comment se sentez-vous en rapport avec votre famille?\",\"question\":\"Quelle est votre perception de la relation entre votre situation et votre famille? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"high_1\",\"label\":\"Sans différence\",\"severity\":\"high\"},{\"question_id\":\"q8\",\"title\":\"Quelle est votre perception de la relation entre stress et a\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à l\'abstinence? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q9\",\"title\":\"Quelle est votre perception de la relation entre stress et s\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à la santé mentale? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"},{\"question_id\":\"q10\",\"title\":\"Quelle est votre perception de la relation entre stress et s\",\"question\":\"Comment se sentez-vous en rapport avec le stress lié à votre situation générale? (a) Bien, (b) Mauvaise, (c) Sans différence)\",\"value\":\"low_1\",\"label\":\"Bien\",\"severity\":\"low\"}]}', '2026-05-30 18:32:27', '2026-05-30 18:32:27'),
(7, 14, 'general', 'bonjour je me sens pas bien et je veux change ma vie ! ', 'eleve', 16, 'professional_support', 'negatif', '[\"desire\",\"sadness\",\"disappointment\"]', '[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"q1\",\"title\":\"comment vous sentez-vous?\",\"question\":\"Comment vous sentez-vous actuellement ? (bien, moyen, mauvais)\",\"value\":\"med_1\",\"label\":\"C\'est un peu difficile pour moi aujourd\'hui.\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"votre vie quotidienne\",\"question\":\"Comment votre vie quotidienne est-elle ? (géniale, moyenne, difficile)\",\"value\":\"high_1\",\"label\":\"Je n\'arrive pas à faire mes tâches quotidiennes.\",\"severity\":\"high\"},{\"question_id\":\"q3\",\"title\":\"vos pensées et sentiments\",\"question\":\"Quels sont vos principaux sentiments ? (triste, déçu, optimiste)\",\"value\":\"high_1\",\"label\":\"Je me sens optimiste et positif.\",\"severity\":\"high\"},{\"question_id\":\"q4\",\"title\":\"vos objectifs\",\"question\":\"Quels sont vos principaux objectifs ? (changer, maintenir, oublier)\",\"value\":\"low_1\",\"label\":\"Je veux changer ma vie.\",\"severity\":\"low\"},{\"question_id\":\"q5\",\"title\":\"vos ressources\",\"question\":\"Quelles ressources avez-vous ? (personnelles, professionnelles, sociales)\",\"value\":\"high_1\",\"label\":\"Je n\'ai pas d\'outils ou d\'aide pour moi-même ou avec quelqu\'un d\'autre.\",\"severity\":\"high\"},{\"question_id\":\"q6\",\"title\":\"vos défis actuels\",\"question\":\"Quels sont vos principaux défis ? (personnels, professionnels, financiers)\",\"value\":\"med_1\",\"label\":\"J\'ai des problèmes de santé à résoudre.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"vos rêves et aspirations\",\"question\":\"Quels sont vos rêves ? (personnels, professionnels, familiaux)\",\"value\":\"med_1\",\"label\":\"J\'aimerais être en bonne santé.\",\"severity\":\"medium\"},{\"question_id\":\"q8\",\"title\":\"vos expériences passées\",\"question\":\"Quelles sont vos expériences passées ? (positives, négatives, inconnues)\",\"value\":\"high_1\",\"label\":\"Je n\'ai pas d\'expériences positives ou négatives en mémoire.\",\"severity\":\"high\"},{\"question_id\":\"q9\",\"title\":\"vos attentes pour l\'avenir\",\"question\":\"Quelles sont vos attentes ? (positives, négatives, inconnues)\",\"value\":\"low_1\",\"label\":\"Je veux être heureux.\",\"severity\":\"low\"},{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"average\",\"label\":\"Moyennement\",\"severity\":\"medium\"}]', '{\"risk\":{\"level\":\"eleve\",\"score\":16,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"desire\",\"sadness\",\"disappointment\"],\"intent\":\"emotional distress\"},\"answers_summary\":{\"total\":10,\"high_severity\":4,\"medium_severity\":4},\"orientation\":{\"type\":\"professional_support\",\"title\":\"Accompagnement professionnel recommandé\",\"message\":\"Un suivi avec un psychologue serait bénéfique.\",\"actions\":[\"Consulter un psychologue de la plateforme\",\"Utiliser le chat ACA au quotidien\"]},\"recommendations\":[\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"q1\",\"title\":\"comment vous sentez-vous?\",\"question\":\"Comment vous sentez-vous actuellement ? (bien, moyen, mauvais)\",\"value\":\"med_1\",\"label\":\"C\'est un peu difficile pour moi aujourd\'hui.\",\"severity\":\"medium\"},{\"question_id\":\"q2\",\"title\":\"votre vie quotidienne\",\"question\":\"Comment votre vie quotidienne est-elle ? (géniale, moyenne, difficile)\",\"value\":\"high_1\",\"label\":\"Je n\'arrive pas à faire mes tâches quotidiennes.\",\"severity\":\"high\"},{\"question_id\":\"q3\",\"title\":\"vos pensées et sentiments\",\"question\":\"Quels sont vos principaux sentiments ? (triste, déçu, optimiste)\",\"value\":\"high_1\",\"label\":\"Je me sens optimiste et positif.\",\"severity\":\"high\"},{\"question_id\":\"q4\",\"title\":\"vos objectifs\",\"question\":\"Quels sont vos principaux objectifs ? (changer, maintenir, oublier)\",\"value\":\"low_1\",\"label\":\"Je veux changer ma vie.\",\"severity\":\"low\"},{\"question_id\":\"q5\",\"title\":\"vos ressources\",\"question\":\"Quelles ressources avez-vous ? (personnelles, professionnelles, sociales)\",\"value\":\"high_1\",\"label\":\"Je n\'ai pas d\'outils ou d\'aide pour moi-même ou avec quelqu\'un d\'autre.\",\"severity\":\"high\"},{\"question_id\":\"q6\",\"title\":\"vos défis actuels\",\"question\":\"Quels sont vos principaux défis ? (personnels, professionnels, financiers)\",\"value\":\"med_1\",\"label\":\"J\'ai des problèmes de santé à résoudre.\",\"severity\":\"medium\"},{\"question_id\":\"q7\",\"title\":\"vos rêves et aspirations\",\"question\":\"Quels sont vos rêves ? (personnels, professionnels, familiaux)\",\"value\":\"med_1\",\"label\":\"J\'aimerais être en bonne santé.\",\"severity\":\"medium\"},{\"question_id\":\"q8\",\"title\":\"vos expériences passées\",\"question\":\"Quelles sont vos expériences passées ? (positives, négatives, inconnues)\",\"value\":\"high_1\",\"label\":\"Je n\'ai pas d\'expériences positives ou négatives en mémoire.\",\"severity\":\"high\"},{\"question_id\":\"q9\",\"title\":\"vos attentes pour l\'avenir\",\"question\":\"Quelles sont vos attentes ? (positives, négatives, inconnues)\",\"value\":\"low_1\",\"label\":\"Je veux être heureux.\",\"severity\":\"low\"},{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"average\",\"label\":\"Moyennement\",\"severity\":\"medium\"}]}', '2026-06-02 13:36:47', '2026-06-02 13:36:47'),
(8, 1, 'general', 'je me sens pas bien et je veux soulager \n', 'modere', 8, 'guided_support', 'negatif', '[\"sadness\",\"disappointment\",\"desire\"]', '[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"]', '[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"good\",\"label\":\"Plutôt bien\",\"severity\":\"low\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"interrupted\",\"label\":\"Sommeil interrompu\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"one\",\"label\":\"Une seule personne\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"high\",\"label\":\"Fortement déterminé(e)\",\"severity\":\"low\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"high\",\"label\":\"Beaucoup\",\"severity\":\"high\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"rare\",\"label\":\"Rarement\",\"severity\":\"low\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"irregular\",\"label\":\"Oui, irrégulièrement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"few\",\"label\":\"1 à 2 fois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"never\",\"label\":\"Jamais\",\"severity\":\"low\"}]', '{\"risk\":{\"level\":\"modere\",\"score\":8,\"max_score\":30},\"nlp\":{\"sentiment\":\"negatif\",\"dominant_emotions\":[\"sadness\",\"disappointment\",\"desire\"],\"intent\":\"need help\"},\"answers_summary\":{\"total\":10,\"high_severity\":1,\"medium_severity\":5},\"orientation\":{\"type\":\"guided_support\",\"title\":\"Accompagnement guidé conseillé\",\"message\":\"Un suivi régulier avec l\'assistant IA peut vous aider.\",\"actions\":[\"Discuter avec l\'assistant ACA\",\"Suivre les recommandations personnalisées\"]},\"recommendations\":[\"Pratiquer des techniques de relaxation (respiration, méditation)\",\"Identifier les situations à risque et préparer un plan\",\"Discuter régulièrement avec l\'assistant ACA pour le suivi\"],\"raw_answers\":[{\"question_id\":\"fallback_q1\",\"title\":\"Niveau de bien-être\",\"question\":\"Comment évalueriez-vous votre bien-être actuel ?\",\"value\":\"good\",\"label\":\"Plutôt bien\",\"severity\":\"low\"},{\"question_id\":\"fallback_q2\",\"title\":\"Qualité du sommeil\",\"question\":\"Comment dormez-vous ces derniers jours ?\",\"value\":\"interrupted\",\"label\":\"Sommeil interrompu\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q3\",\"title\":\"Soutien social\",\"question\":\"Avez-vous des proches vers qui vous tourner ?\",\"value\":\"one\",\"label\":\"Une seule personne\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q4\",\"title\":\"Motivation\",\"question\":\"À quel point êtes-vous motivé(e) à changer ?\",\"value\":\"high\",\"label\":\"Fortement déterminé(e)\",\"severity\":\"low\"},{\"question_id\":\"fallback_q5\",\"title\":\"Stress quotidien\",\"question\":\"À quel point ressentez-vous du stress au quotidien ?\",\"value\":\"high\",\"label\":\"Beaucoup\",\"severity\":\"high\"},{\"question_id\":\"fallback_q6\",\"title\":\"Envies de consommer\",\"question\":\"Avez-vous des envies de consommer en ce moment ?\",\"value\":\"sometimes\",\"label\":\"Parfois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q7\",\"title\":\"Émotions négatives\",\"question\":\"Ressentez-vous fréquemment des émotions négatives ?\",\"value\":\"rare\",\"label\":\"Rarement\",\"severity\":\"low\"},{\"question_id\":\"fallback_q8\",\"title\":\"Suivi médical\",\"question\":\"Êtes-vous suivi(e) par un professionnel actuellement ?\",\"value\":\"irregular\",\"label\":\"Oui, irrégulièrement\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q9\",\"title\":\"Tentatives passées\",\"question\":\"Avez-vous déjà essayé de changer dans le passé ?\",\"value\":\"few\",\"label\":\"1 à 2 fois\",\"severity\":\"medium\"},{\"question_id\":\"fallback_q10\",\"title\":\"Pensées sombres\",\"question\":\"Avez-vous des pensées sombres ou de découragement ?\",\"value\":\"never\",\"label\":\"Jamais\",\"severity\":\"low\"}]}', '2026-06-02 21:08:17', '2026-06-02 21:08:17');

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) DEFAULT NULL,
  `appointment_id` bigint(20) DEFAULT NULL,
  `plan_id` bigint(20) DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_checkout_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'DZD',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `psychologist_id`, `appointment_id`, `plan_id`, `provider`, `provider_payment_id`, `provider_checkout_url`, `amount`, `currency`, `status`, `payment_method`, `paid_at`, `failed_at`, `metadata`, `created_at`, `updated_at`) VALUES
(4, 1, 1, 5, NULL, 'manual', 'manual_1779037347468_1', 'http://localhost:3000/payment/manual/manual_1779037347468_1', '2500.00', 'DZD', 'paid', 'manual', '2026-05-17 17:02:55', NULL, '{\"description\":\"Paiement rendez-vous #5\",\"proof_reference\":\"CCP-TEST-002\",\"notes\":\"Paiement manuel via CCP\",\"source\":\"appointment\"}', '2026-05-17 17:02:27', '2026-05-17 17:02:55'),
(5, 6, 1, 6, NULL, 'manual', 'manual_1779184551034_6', 'http://localhost:3000/payment/manual/manual_1779184551034_6', '2500.00', 'DZD', 'paid', 'manual', '2026-05-19 09:56:32', NULL, '{\"description\":\"Paiement rendez-vous #6\",\"proof_reference\":\"CCP-TEST-001\",\"notes\":\"Paiement manuel via CCP\",\"source\":\"appointment\"}', '2026-05-19 09:55:51', '2026-05-19 09:56:32'),
(6, 1, 1, 8, NULL, 'manual', 'manual_1780487348681_1', 'http://localhost:3000/payment/manual/manual_1780487348681_1', '2500.00', 'DZD', 'pending', 'manual', NULL, NULL, '{\"description\":\"Paiement rendez-vous #8\",\"proof_reference\":\"CCP-TEST-001\",\"notes\":\"Paiement manuel via CCP\",\"source\":\"appointment\"}', '2026-06-03 11:49:08', '2026-06-03 11:49:08'),
(7, 1, 1, 10, NULL, 'manual', 'manual_1780489334886_1', 'http://localhost:3000/payment/manual/manual_1780489334886_1', '2500.00', 'DZD', 'paid', 'manual', '2026-06-03 12:28:28', NULL, '{\"description\":\"Paiement rendez-vous #10\",\"proof_reference\":\"CCP-TEST-001\",\"notes\":\"Paiement manuel via CCP\",\"source\":\"appointment\"}', '2026-06-03 12:22:14', '2026-06-03 12:28:28'),
(8, 1, 1, 11, NULL, 'manual', 'manual_1780500674723_1', 'http://localhost:3000/payment/manual/manual_1780500674723_1', '2500.00', 'DZD', 'paid', 'ccp', '2026-06-03 15:31:52', NULL, '{\"description\":\"Paiement rendez-vous #11\",\"proof_reference\":\"fggh\",\"notes\":\"Paiement manuel envoyé pour validation.\",\"source\":\"appointment\",\"payment_method_id\":1,\"payment_method_name\":\"Paiement CCP\",\"payment_method_type\":\"ccp\",\"payment_method_account_holder\":\"Nom titulaire CCP\",\"payment_method_ccp_number\":\"0000000000\",\"payment_method_rip_key\":\"00\",\"proof_file_url\":\"/uploads/payments/proof-1780500674708-940030781.png\",\"proof_file_name\":\"proof-1780500674708-940030781.png\",\"proof_original_name\":\"card_note_feuille_javafx.png\",\"proof_mime_type\":\"image/png\",\"proof_size\":27768,\"proof_uploaded_at\":\"2026-06-03T15:31:14.723Z\"}', '2026-06-03 15:31:14', '2026-06-03 15:31:52'),
(9, 1, 1, 12, NULL, 'manual', 'manual_1780522804689_1', 'http://localhost:3000/payment/manual/manual_1780522804689_1', '2500.00', 'DZD', 'pending', 'ccp', NULL, NULL, '{\"description\":\"Paiement rendez-vous #12\",\"proof_reference\":\"dfh\",\"notes\":\"Paiement manuel envoyé pour validation.\",\"source\":\"appointment\",\"payment_method_id\":1,\"payment_method_name\":\"Paiement CCP\",\"payment_method_type\":\"ccp\",\"payment_method_account_holder\":\"Nom titulaire CCP\",\"payment_method_ccp_number\":\"0000000000\",\"payment_method_rip_key\":\"00\",\"proof_file_url\":\"/uploads/payments/proof-1780522804669-324558906.jpg\",\"proof_file_name\":\"proof-1780522804669-324558906.jpg\",\"proof_original_name\":\"aminesm.jpg\",\"proof_mime_type\":\"image/jpeg\",\"proof_size\":40114,\"proof_uploaded_at\":\"2026-06-03T21:40:04.689Z\"}', '2026-06-03 21:40:04', '2026-06-03 21:40:04'),
(10, 1, 1, 13, NULL, 'manual', 'manual_1780530617251_1', 'http://localhost:3000/payment/manual/manual_1780530617251_1', '2500.00', 'DZD', 'paid', 'ccp', '2026-06-03 23:51:11', NULL, '{\"description\":\"Paiement rendez-vous #13\",\"proof_reference\":\"dgsg\",\"notes\":\"Paiement manuel envoyé pour validation.\",\"source\":\"appointment\",\"payment_method_id\":1,\"payment_method_name\":\"Paiement CCP\",\"payment_method_type\":\"ccp\",\"payment_method_account_holder\":\"Nom titulaire CCP\",\"payment_method_ccp_number\":\"0000000000\",\"payment_method_rip_key\":\"00\",\"proof_file_url\":\"/uploads/payments/proof-1780530617228-67969489.png\",\"proof_file_name\":\"proof-1780530617228-67969489.png\",\"proof_original_name\":\"ee.png\",\"proof_mime_type\":\"image/png\",\"proof_size\":540549,\"proof_uploaded_at\":\"2026-06-03T23:50:17.251Z\"}', '2026-06-03 23:50:17', '2026-06-03 23:51:11');

-- --------------------------------------------------------

--
-- Structure de la table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `method_type` varchar(50) NOT NULL DEFAULT 'ccp',
  `name` varchar(150) NOT NULL,
  `account_holder` varchar(150) DEFAULT NULL,
  `ccp_number` varchar(100) DEFAULT NULL,
  `rip_key` varchar(100) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `phone_number` varchar(100) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `method_type`, `name`, `account_holder`, `ccp_number`, `rip_key`, `bank_name`, `phone_number`, `instructions`, `is_active`, `sort_order`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'ccp', 'Paiement CCP', 'Nom titulaire CCP', '0000000000', '00', 'Algérie Poste', '', 'Envoyez le paiement via CCP puis joignez la preuve PNG/JPG/PDF.', 1, 1, NULL, '2026-06-03 14:29:09', '2026-06-03 14:29:09');

-- --------------------------------------------------------

--
-- Structure de la table `payment_webhooks`
--

CREATE TABLE `payment_webhooks` (
  `id` bigint(20) NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `processed` tinyint(1) DEFAULT 0,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `plans`
--

CREATE TABLE `plans` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'DZD',
  `duration_days` int(11) DEFAULT NULL,
  `sessions_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `plans`
--

INSERT INTO `plans` (`id`, `name`, `description`, `type`, `price`, `currency`, `duration_days`, `sessions_count`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Gratuit', 'Chatbot, questionnaire et conseils de base', 'free', '0.00', 'DZD', NULL, 0, 1, '2026-05-16 21:22:13', '2026-05-16 21:22:13'),
(2, 'Consultation unique', 'Une séance avec un psychologue', 'consultation', '2500.00', 'DZD', NULL, 1, 1, '2026-05-16 21:22:13', '2026-05-16 21:22:13'),
(3, 'Pack 4 séances', 'Pack de 4 consultations psychologiques', 'session_pack', '9000.00', 'DZD', NULL, 4, 1, '2026-05-16 21:22:13', '2026-05-16 21:22:13'),
(4, 'Abonnement mensuel', 'Suivi mensuel avec accompagnement personnalisé', 'subscription', '6000.00', 'DZD', 30, 2, 1, '2026-05-16 21:22:13', '2026-05-16 21:22:13');

-- --------------------------------------------------------

--
-- Structure de la table `psychologists`
--

CREATE TABLE `psychologists` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Algeria',
  `languages` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accepts_online` tinyint(1) DEFAULT 1,
  `accepts_in_person` tinyint(1) DEFAULT 0,
  `consultation_price` decimal(10,2) DEFAULT 0.00,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'DZD',
  `max_active_cases` int(11) DEFAULT 20,
  `current_active_cases` int(11) DEFAULT 0,
  `rating` decimal(3,2) DEFAULT 0.00,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `psychologists`
--

INSERT INTO `psychologists` (`id`, `full_name`, `email`, `phone`, `password_hash`, `license_number`, `specialization`, `experience_years`, `city`, `country`, `languages`, `accepts_online`, `accepts_in_person`, `consultation_price`, `currency`, `max_active_cases`, `current_active_cases`, `rating`, `is_verified`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Dr Sara Benali', 'sara@test.com', '0551111111', '$2a$10$fhn68lhIr1XLaGn/Nbtrg.s/CXEKVE8dzwjx/pDtfG/ZFCJbSIJtO', 'PSY-001', 'addiction toxicomanie stress anxiete', 5, 'Alger', 'Algeria', 'français,arabe', 1, 1, '2500.00', 'DZD', 20, 6, '0.00', 1, 1, '2026-05-17 11:04:24', '2026-05-31 16:54:39');

-- --------------------------------------------------------

--
-- Structure de la table `psychologist_assignments`
--

CREATE TABLE `psychologist_assignments` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) NOT NULL,
  `assigned_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `psychologist_assignments`
--

INSERT INTO `psychologist_assignments` (`id`, `user_id`, `psychologist_id`, `assigned_by`, `status`, `start_date`, `end_date`) VALUES
(2, 1, 1, 'user', 'active', '2026-05-17 17:01:48', NULL),
(3, 6, 1, 'user', 'active', '2026-05-19 09:55:07', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `psychologist_payouts`
--

CREATE TABLE `psychologist_payouts` (
  `id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) NOT NULL,
  `payment_id` bigint(20) NOT NULL,
  `gross_amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `psychologist_payouts`
--

INSERT INTO `psychologist_payouts` (`id`, `psychologist_id`, `payment_id`, `gross_amount`, `platform_fee`, `net_amount`, `status`, `paid_at`, `created_at`) VALUES
(4, 1, 4, '2500.00', '375.00', '2125.00', 'paid', '2026-05-19 10:02:17', '2026-05-17 17:02:55'),
(5, 1, 5, '2500.00', '375.00', '2125.00', 'paid', '2026-05-19 10:02:17', '2026-05-19 09:56:32'),
(6, 1, 7, '2500.00', '375.00', '2125.00', 'pending', NULL, '2026-06-03 12:28:28'),
(7, 1, 8, '2500.00', '375.00', '2125.00', 'pending', NULL, '2026-06-03 15:31:52'),
(8, 1, 10, '2500.00', '375.00', '2125.00', 'pending', NULL, '2026-06-03 23:51:11');

-- --------------------------------------------------------

--
-- Structure de la table `psychologist_recommendations`
--

CREATE TABLE `psychologist_recommendations` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) NOT NULL,
  `recommendation_score` decimal(5,2) DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'suggested',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `psychologist_recommendations`
--

INSERT INTO `psychologist_recommendations` (`id`, `user_id`, `psychologist_id`, `recommendation_score`, `reason`, `status`, `created_at`) VALUES
(2, 1, 1, '100.00', 'Score 100/100 : niveau de risque eleve détecté par l’IA, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'accepted', '2026-05-17 17:01:46'),
(3, 1, 1, '100.00', 'Score 100/100 : niveau de risque eleve détecté par l’IA, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'rejected', '2026-05-17 17:03:40'),
(5, 6, 1, '100.00', 'Score 100/100 : niveau de risque critique détecté par l’IA, orientation IA : redirection_humaine, vulnérabilité élevée détectée, besoin d’aide identifié, risque de rechute suspecté, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'accepted', '2026-05-19 09:55:01'),
(12, 12, 1, '100.00', 'Score 100/100 : niveau de risque modere détecté par l’IA, orientation IA : accompagnement_personnalise, besoin d’aide identifié, risque de rechute suspecté, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'suggested', '2026-05-28 13:29:48'),
(14, 1, 1, '100.00', 'Score 100/100 : niveau de risque eleve détecté par l’IA, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'accepted', '2026-06-01 01:19:51'),
(15, 1, 1, '100.00', 'Score 100/100 : niveau de risque eleve détecté par l’IA, psychologue spécialisé en addiction, même ville, langue compatible, consultation en ligne disponible, expérience adaptée.', 'accepted', '2026-06-02 13:31:22');

-- --------------------------------------------------------

--
-- Structure de la table `psychologist_slots`
--

CREATE TABLE `psychologist_slots` (
  `id` bigint(20) NOT NULL,
  `psychologist_id` bigint(20) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `mode` varchar(50) DEFAULT 'online',
  `status` varchar(50) DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `psychologist_slots`
--

INSERT INTO `psychologist_slots` (`id`, `psychologist_id`, `slot_date`, `start_time`, `end_time`, `mode`, `status`, `created_at`) VALUES
(2, 1, '2026-06-03', '14:00:00', '14:45:00', 'online', 'booked', '2026-06-03 12:14:38'),
(3, 1, '2026-06-03', '18:50:00', '19:50:00', 'in_person', 'booked', '2026-06-03 15:13:08'),
(4, 1, '2026-06-03', '23:00:00', '23:45:00', 'in_person', 'pending', '2026-06-03 21:03:12'),
(5, 1, '2026-06-04', '10:00:00', '10:45:00', 'online', 'pending', '2026-06-03 23:49:23');

-- --------------------------------------------------------

--
-- Structure de la table `questionnaires`
--

CREATE TABLE `questionnaires` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `questionnaire_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answers`)),
  `total_score` int(11) DEFAULT NULL,
  `risk_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `questionnaires`
--

INSERT INTO `questionnaires` (`id`, `user_id`, `questionnaire_type`, `answers`, `total_score`, `risk_level`, `created_at`) VALUES
(1, 1, 'initial', '{\"substance\":\"cannabis\",\"frequency\":\"daily\",\"duration_months\":12,\"has_relapse\":true,\"needs_psychologist\":true,\"sleep_problem\":true,\"anxiety_level\":8}', 65, 'eleve', '2026-05-16 21:27:23'),
(6, 6, 'initial', '{\"q1\":\"oui\",\"q2\":\"oui\",\"q3\":\"non\",\"q4\":\"oui\",\"q5\":\"oui\",\"q6\":\"oui\",\"q7\":\"non\",\"q8\":\"oui\",\"q9\":\"oui\",\"q10\":\"oui\"}', 11, 'eleve', '2026-05-19 09:44:49');

-- --------------------------------------------------------

--
-- Structure de la table `refunds`
--

CREATE TABLE `refunds` (
  `id` bigint(20) NOT NULL,
  `payment_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `risk_alerts`
--

CREATE TABLE `risk_alerts` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `conversation_id` bigint(20) DEFAULT NULL,
  `alert_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_excerpt` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `reviewed_by_admin_id` bigint(20) DEFAULT NULL,
  `reviewed_by_psychologist_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `risk_alerts`
--

INSERT INTO `risk_alerts` (`id`, `user_id`, `conversation_id`, `alert_type`, `risk_level`, `message_excerpt`, `status`, `reviewed_by_admin_id`, `reviewed_by_psychologist_id`, `created_at`, `reviewed_at`) VALUES
(6, 6, 29, 'addiction_high_risk', 'eleve', 'L\'utilisateur a complété le questionnaire initial et demande une analyse.', 'open', NULL, NULL, '2026-05-19 09:44:49', NULL),
(7, 6, 29, 'emergency', 'critique', 'Je suis stressé aujourd’hui et j’ai peur de rechuter.', 'open', NULL, NULL, '2026-05-19 09:50:38', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `plan_id` bigint(20) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NULL DEFAULT NULL,
  `last_payment_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `psychologist_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `objective` text DEFAULT NULL,
  `reflection_question_1` varchar(500) DEFAULT NULL,
  `reflection_question_2` varchar(500) DEFAULT NULL,
  `frequency` enum('daily','weekly') NOT NULL DEFAULT 'daily',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `status` enum('active','completed','paused','archived') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `psychologist_id`, `title`, `description`, `objective`, `reflection_question_1`, `reflection_question_2`, `frequency`, `start_date`, `end_date`, `due_at`, `status`, `created_at`, `updated_at`) VALUES
(5, 1, 1, 'qsdqsdqsdsqd', 'qsdqsdqsd', 'qdqsdqsd', 'qsdqsdqs', 'dqsdqsd', 'daily', '2026-06-02', NULL, NULL, 'active', '2026-06-02 13:23:43', '2026-06-02 13:23:43'),
(6, 1, 1, 'gym', 'qsdqsd', 'qsdqsd', 'qsdqs', 'qsdqsdq', 'daily', '2026-06-02', NULL, NULL, 'active', '2026-06-02 21:14:53', '2026-06-02 21:14:53');

-- --------------------------------------------------------

--
-- Structure de la table `task_completions`
--

CREATE TABLE `task_completions` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `feeling_score` tinyint(4) NOT NULL DEFAULT 5,
  `reflection_answer_1` text DEFAULT NULL,
  `reflection_answer_2` text DEFAULT NULL,
  `psy_note` text DEFAULT NULL,
  `psy_reviewed` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `task_completions`
--

INSERT INTO `task_completions` (`id`, `task_id`, `user_id`, `completed_at`, `feeling_score`, `reflection_answer_1`, `reflection_answer_2`, `psy_note`, `psy_reviewed`) VALUES
(5, 5, 1, '2026-06-02 13:24:16', 5, NULL, NULL, NULL, 0),
(7, 6, 1, '2026-06-02 21:15:30', 5, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Algeria',
  `preferred_language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'français',
  `addiction_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consumption_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `is_active` tinyint(1) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `birth_date`, `gender`, `city`, `country`, `preferred_language`, `addiction_type`, `consumption_level`, `risk_level`, `is_active`, `is_verified`, `created_at`, `updated_at`) VALUES
(1, 'Ahmed Test', 'ahmed@test.com', '0550000000', '$2a$10$jkQJ40Dc7S5cCBYmBDTOKe2HWDJ9x1Yx1s75r6.pd5RqMe4pk80w2', '2000-01-01', 'male', 'Alger', 'Algeria', 'français', 'cannabis', 'moyen', 'modere', 1, 0, '2026-05-16 21:22:36', '2026-06-02 21:08:17'),
(2, 'Amine Said mansour', 'aminesaidmansour73@gmail.com', '0560727300', '$2a$10$.79nmuHeLbdlwlhgcRVLSe0DssfnWVdrMiT.XezRTfhFM8.mH3Rvy', NULL, NULL, 'oran', 'Algeria', 'français', 'autre', 'faible', 'unknown', 1, 0, '2026-05-17 10:44:10', '2026-05-17 10:44:10'),
(6, 'test', 'test@gmail.com', '0555555655', '$2a$10$4c/iM5xw47ydta4ba5GziOWI9xgc9.7rSTXylic6yYt6y5qgp5R0K', NULL, NULL, 'Alger', 'Algeria', 'français', 'cannabis', 'moyen', 'critique', 1, 0, '2026-05-19 09:44:18', '2026-05-19 09:50:38'),
(9, 'azzo', 'azze@g.com', '000000', '$2a$10$5F11SR6T1pgekwukLZpEF.hR6Wof4MHJPSdINcO5EHQoeBkUQAXy6', NULL, NULL, 'Alger', 'Algeria', 'français', 'cannabis', 'moyen', 'unknown', 1, 0, '2026-05-26 11:56:00', '2026-05-26 11:56:00'),
(12, 'wassim ', 'waassim@g.com', '01234563', '$2a$10$R0KCxOejsmB.gZl08qMG3ew8usaCM/Z2xOzZFcL4LWHrPiAqgkafi', NULL, NULL, 'Alger', 'Algeria', 'français', 'cannabis', 'moyen', 'modere', 1, 0, '2026-05-28 13:25:53', '2026-05-28 13:28:38'),
(14, 'sofiane', 'sofiane@test.com', '000000', '$2a$10$TNYq2pkz2lTBfpaQi6PLmOhl0WSHHlOSIPvoD0Ki7eUaUMkC3OnEq', NULL, NULL, 'Alger', 'Algeria', 'français', 'cannabis', 'moyen', 'eleve', 1, 0, '2026-06-02 13:34:09', '2026-06-02 13:36:47');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointments_user` (`user_id`),
  ADD KEY `idx_appointments_psychologist` (`psychologist_id`),
  ADD KEY `idx_appointments_status` (`status`),
  ADD KEY `fk_appointments_slot_2` (`slot_id`);

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `consents`
--
ALTER TABLE `consents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversations_user` (`user_id`);

--
-- Index pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_messages_conversation` (`conversation_id`);

--
-- Index pour la table `nlp_analyses`
--
ALTER TABLE `nlp_analyses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `idx_nlp_user` (`user_id`),
  ADD KEY `idx_nlp_conversation` (`conversation_id`),
  ADD KEY `idx_nlp_risk` (`risk_level`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_receiver` (`receiver_type`,`receiver_id`);

--
-- Index pour la table `onboarding_profiles`
--
ALTER TABLE `onboarding_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_risk_level` (`risk_level`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `psychologist_id` (`psychologist_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_payments_user` (`user_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_provider_payment_id` (`provider_payment_id`);

--
-- Index pour la table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payment_methods_active` (`is_active`),
  ADD KEY `idx_payment_methods_type` (`method_type`);

--
-- Index pour la table `payment_webhooks`
--
ALTER TABLE `payment_webhooks`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `psychologists`
--
ALTER TABLE `psychologists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_psychologists_email` (`email`),
  ADD KEY `idx_psychologists_verified` (`is_verified`),
  ADD KEY `idx_psychologists_city` (`city`);

--
-- Index pour la table `psychologist_assignments`
--
ALTER TABLE `psychologist_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `psychologist_id` (`psychologist_id`);

--
-- Index pour la table `psychologist_payouts`
--
ALTER TABLE `psychologist_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `psychologist_id` (`psychologist_id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Index pour la table `psychologist_recommendations`
--
ALTER TABLE `psychologist_recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `psychologist_id` (`psychologist_id`);

--
-- Index pour la table `psychologist_slots`
--
ALTER TABLE `psychologist_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_slots_psychologist` (`psychologist_id`),
  ADD KEY `idx_slots_status` (`status`);

--
-- Index pour la table `questionnaires`
--
ALTER TABLE `questionnaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `risk_alerts`
--
ALTER TABLE `risk_alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `reviewed_by_admin_id` (`reviewed_by_admin_id`),
  ADD KEY `reviewed_by_psychologist_id` (`reviewed_by_psychologist_id`),
  ADD KEY `idx_alerts_status` (`status`),
  ADD KEY `idx_alerts_risk` (`risk_level`);

--
-- Index pour la table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `last_payment_id` (`last_payment_id`);

--
-- Index pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_psy` (`psychologist_id`),
  ADD KEY `idx_status` (`status`);

--
-- Index pour la table `task_completions`
--
ALTER TABLE `task_completions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task` (`task_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_risk_level` (`risk_level`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `consents`
--
ALTER TABLE `consents`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT pour la table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT pour la table `nlp_analyses`
--
ALTER TABLE `nlp_analyses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT pour la table `onboarding_profiles`
--
ALTER TABLE `onboarding_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `payment_webhooks`
--
ALTER TABLE `payment_webhooks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `plans`
--
ALTER TABLE `plans`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `psychologists`
--
ALTER TABLE `psychologists`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `psychologist_assignments`
--
ALTER TABLE `psychologist_assignments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `psychologist_payouts`
--
ALTER TABLE `psychologist_payouts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `psychologist_recommendations`
--
ALTER TABLE `psychologist_recommendations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `psychologist_slots`
--
ALTER TABLE `psychologist_slots`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `questionnaires`
--
ALTER TABLE `questionnaires`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `risk_alerts`
--
ALTER TABLE `risk_alerts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT pour la table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `task_completions`
--
ALTER TABLE `task_completions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_appointments_slot` FOREIGN KEY (`slot_id`) REFERENCES `psychologist_slots` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_appointments_slot_2` FOREIGN KEY (`slot_id`) REFERENCES `psychologist_slots` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `consents`
--
ALTER TABLE `consents`
  ADD CONSTRAINT `consents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `nlp_analyses`
--
ALTER TABLE `nlp_analyses`
  ADD CONSTRAINT `nlp_analyses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nlp_analyses_ibfk_2` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `nlp_analyses_ibfk_3` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `psychologist_assignments`
--
ALTER TABLE `psychologist_assignments`
  ADD CONSTRAINT `psychologist_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `psychologist_assignments_ibfk_2` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `psychologist_payouts`
--
ALTER TABLE `psychologist_payouts`
  ADD CONSTRAINT `psychologist_payouts_ibfk_1` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `psychologist_payouts_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `psychologist_recommendations`
--
ALTER TABLE `psychologist_recommendations`
  ADD CONSTRAINT `psychologist_recommendations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `psychologist_recommendations_ibfk_2` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `psychologist_slots`
--
ALTER TABLE `psychologist_slots`
  ADD CONSTRAINT `fk_slots_psychologist` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `questionnaires`
--
ALTER TABLE `questionnaires`
  ADD CONSTRAINT `questionnaires_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `risk_alerts`
--
ALTER TABLE `risk_alerts`
  ADD CONSTRAINT `risk_alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `risk_alerts_ibfk_2` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `risk_alerts_ibfk_3` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `risk_alerts_ibfk_4` FOREIGN KEY (`reviewed_by_psychologist_id`) REFERENCES `psychologists` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_ibfk_3` FOREIGN KEY (`last_payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
