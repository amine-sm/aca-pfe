const { query } = require("../database/db");


// ============================================
// HELPER : récupérer le psychologist_id depuis email
// ============================================
async function resolvePsychologistId(email, fallbackId) {
  try {
    const psy = await query(
      "SELECT id FROM psychologists WHERE email = ?",
      [email]
    );
    if (psy && psy.length > 0) {
      return psy[0].id;
    }
  } catch (e) {}
  return fallbackId;
}


// ============================================
// USER : récupérer mes tâches
// ============================================
async function getMyTasks(req, res) {
  try {
    const userId = req.auth.id;

    const tasks = await query(
      `SELECT t.* FROM tasks t
       WHERE t.user_id = ? AND t.status = 'active'
       ORDER BY t.created_at DESC`,
      [userId]
    );

    for (const task of tasks) {
      try {
        const count = await query(
          "SELECT COUNT(*) AS n FROM task_completions WHERE task_id = ?",
          [task.id]
        );
        task.completions_count = count[0]?.n || 0;
      } catch (e) {
        task.completions_count = 0;
      }
    }

    return res.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    console.error("Erreur getMyTasks:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des tâches",
      error: error.message,
    });
  }
}


// ============================================
// USER : valider une tâche
// ============================================
async function completeTask(req, res) {
  try {
    const userId = req.auth.id;
    const { taskId } = req.params;
    const { score, reflection } = req.body;

    const taskCheck = await query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (!taskCheck || taskCheck.length === 0) {
      return res.status(404).json({ success: false, message: "Tâche introuvable" });
    }

    const safeScore = Math.max(1, Math.min(10, Number(score) || 5));

    try {
      await query(
        `INSERT INTO task_completions (task_id, user_id, score, reflection, completed_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [taskId, userId, safeScore, reflection || ""]
      );
    } catch (e1) {
      try {
        await query(
          `INSERT INTO task_completions (task_id, user_id, reflection, completed_at)
           VALUES (?, ?, ?, NOW())`,
          [taskId, userId, reflection || ""]
        );
      } catch (e2) {
        await query(
          `INSERT INTO task_completions (task_id, user_id) VALUES (?, ?)`,
          [taskId, userId]
        );
      }
    }

    return res.json({ success: true, message: "Tâche validée" });
  } catch (error) {
    console.error("Erreur completeTask:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la validation",
      error: error.message,
    });
  }
}


// ============================================
// 🆕 USER : statistiques de progression (7 derniers jours)
// ============================================
async function getMyProgressStats(req, res) {
  try {
    const userId = req.auth.id;

    // 1. Complétions par jour (7 derniers jours)
    let weeklyData = [];
    try {
      weeklyData = await query(
        `SELECT 
           DATE(completed_at) AS day,
           COUNT(*) AS count,
           AVG(score) AS avg_score
         FROM task_completions
         WHERE user_id = ? 
           AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(completed_at)
         ORDER BY day ASC`,
        [userId]
      );
    } catch (e) {
      weeklyData = await query(
        `SELECT DATE(completed_at) AS day, COUNT(*) AS count
         FROM task_completions
         WHERE user_id = ?
           AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(completed_at)
         ORDER BY day ASC`,
        [userId]
      );
    }

    // 2. Stats globales
    let totalCompletions = 0;
    let avgScore = 0;
    try {
      const totalRes = await query(
        "SELECT COUNT(*) AS n, AVG(score) AS avg FROM task_completions WHERE user_id = ?",
        [userId]
      );
      totalCompletions = totalRes[0]?.n || 0;
      avgScore = Number(totalRes[0]?.avg || 0);
    } catch (e) {
      const totalRes = await query(
        "SELECT COUNT(*) AS n FROM task_completions WHERE user_id = ?",
        [userId]
      );
      totalCompletions = totalRes[0]?.n || 0;
    }

    // 3. Streak (jours consécutifs)
    let streak = 0;
    try {
      const streakData = await query(
        `SELECT DISTINCT DATE(completed_at) AS day 
         FROM task_completions WHERE user_id = ?
         ORDER BY day DESC LIMIT 30`,
        [userId]
      );

      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (const row of streakData) {
        const rowDate = new Date(row.day);
        rowDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((checkDate - rowDate) / (1000 * 60 * 60 * 24));
        if (diffDays === streak) streak++;
        else if (diffDays > streak) break;
      }
    } catch (e) {}

    // 4. Construire les 7 derniers jours (même jours vides)
    const days = [];
    const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dayStr = d.toISOString().split("T")[0];
      const found = weeklyData.find(w => {
        const wDate = new Date(w.day).toISOString().split("T")[0];
        return wDate === dayStr;
      });
      
      days.push({
        date: dayStr,
        label: dayLabels[d.getDay()],
        count: found ? Number(found.count) : 0,
        avg_score: found ? Number(found.avg_score || 0) : 0,
      });
    }

    return res.json({
      success: true,
      stats: {
        weekly_data: days,
        total_completions: totalCompletions,
        avg_score: Number(avgScore.toFixed(1)),
        streak,
      },
    });
  } catch (error) {
    console.error("Erreur getMyProgressStats:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}


// ============================================
// PSYCHOLOGUE : créer une tâche
// ============================================
async function createTask(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);
    const {
      user_id, title, description, objective,
      reflection_question_1, reflection_question_2,
      frequency, start_date, end_date,
    } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({
        success: false,
        message: "user_id et title sont obligatoires",
      });
    }

    const assignment = await query(
      `SELECT * FROM psychologist_assignments 
       WHERE user_id = ? AND psychologist_id = ? AND status = 'active'`,
      [user_id, psychologistId]
    );

    if (!assignment || assignment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Ce patient n'est pas dans votre liste",
      });
    }

    const safeFrequency = ["daily", "weekly"].includes(frequency) ? frequency : "daily";
    const safeStartDate = start_date || new Date().toISOString().split("T")[0];

    const result = await query(
      `INSERT INTO tasks 
        (user_id, psychologist_id, title, description, objective, 
         reflection_question_1, reflection_question_2, frequency, start_date, end_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        user_id, psychologistId, title,
        description || null, objective || null,
        reflection_question_1 || null, reflection_question_2 || null,
        safeFrequency, safeStartDate, end_date || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Tâche créée avec succès",
      task: {
        id: result.insertId,
        user_id, psychologist_id: psychologistId,
        title, description, objective,
        reflection_question_1, reflection_question_2,
        frequency: safeFrequency,
        start_date: safeStartDate, end_date,
        status: "active",
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur createTask:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : modifier
// ============================================
async function updateTask(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);
    const { taskId } = req.params;
    const { title, description, objective, frequency, status } = req.body;

    const taskCheck = await query(
      "SELECT * FROM tasks WHERE id = ? AND psychologist_id = ?",
      [taskId, psychologistId]
    );

    if (!taskCheck || taskCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tâche introuvable ou non autorisée",
      });
    }

    const safeFrequency = ["daily", "weekly"].includes(frequency) ? frequency : "daily";
    const safeStatus = ["active", "completed", "paused", "archived"].includes(status)
      ? status : "active";

    await query(
      `UPDATE tasks 
       SET title = ?, description = ?, objective = ?, frequency = ?, status = ?
       WHERE id = ?`,
      [title, description || null, objective || null, safeFrequency, safeStatus, taskId]
    );

    return res.json({ success: true, message: "Tâche mise à jour" });
  } catch (error) {
    console.error("Erreur updateTask:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : supprimer
// ============================================
async function deleteTask(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);
    const { taskId } = req.params;

    const taskCheck = await query(
      "SELECT * FROM tasks WHERE id = ? AND psychologist_id = ?",
      [taskId, psychologistId]
    );

    if (!taskCheck || taskCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tâche introuvable ou non autorisée",
      });
    }

    try {
      await query("DELETE FROM task_completions WHERE task_id = ?", [taskId]);
    } catch (e) {}

    await query("DELETE FROM tasks WHERE id = ?", [taskId]);

    return res.json({ success: true, message: "Tâche supprimée" });
  } catch (error) {
    console.error("Erreur deleteTask:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : tâches d'un patient
// ============================================
async function getPatientTasks(req, res) {
  try {
    const { userId } = req.params;

    const tasks = await query(
      `SELECT t.* FROM tasks t WHERE t.user_id = ? ORDER BY t.created_at DESC`,
      [userId]
    );

    for (const task of tasks) {
      try {
        const count = await query(
          "SELECT COUNT(*) AS n FROM task_completions WHERE task_id = ?",
          [task.id]
        );
        task.completions_count = count[0]?.n || 0;
      } catch (e) {
        task.completions_count = 0;
      }
    }

    return res.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    console.error("Erreur getPatientTasks:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : alertes
// ============================================
async function getLateTasksAlerts(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);

    const lateTasks = await query(
      `SELECT t.*, u.full_name AS patient_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.psychologist_id = ? AND t.status = 'active'
       ORDER BY t.created_at DESC`,
      [psychologistId]
    );

    return res.json({ success: true, alerts: lateTasks || [] });
  } catch (error) {
    console.error("Erreur getLateTasksAlerts:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : TOUTES les tâches
// ============================================
async function getAllMyPatientsTasks(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);

    const tasks = await query(
      `SELECT 
         t.*,
         u.full_name AS patient_name,
         u.email AS patient_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.psychologist_id = ?
       ORDER BY t.created_at DESC`,
      [psychologistId]
    );

    for (const task of tasks) {
      try {
        const count = await query(
          "SELECT COUNT(*) AS n FROM task_completions WHERE task_id = ?",
          [task.id]
        );
        task.completions_count = count[0]?.n || 0;
      } catch (e) {
        task.completions_count = 0;
      }
    }

    return res.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    console.error("Erreur getAllMyPatientsTasks:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des tâches",
      error: error.message,
    });
  }
}


// ============================================
// PSYCHOLOGUE : liste mes patients
// ============================================
async function getMyPatients(req, res) {
  try {
    const psychologistId = await resolvePsychologistId(req.auth.email, req.auth.id);

    const patients = await query(
      `SELECT u.id, u.full_name, u.email
       FROM psychologist_assignments pa
       INNER JOIN users u ON u.id = pa.user_id
       WHERE pa.psychologist_id = ? AND pa.status = 'active'
       ORDER BY u.full_name ASC`,
      [psychologistId]
    );

    return res.json({ success: true, patients: patients || [] });
  } catch (error) {
    console.error("Erreur getMyPatients:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
}


module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getPatientTasks,
  getLateTasksAlerts,
  getMyTasks,
  completeTask,
  getAllMyPatientsTasks,
  getMyPatients,
  getMyProgressStats,
};