const Participant = require('../models/Participant');
const Race = require('../models/Race');
const generateBIB = require('../utils/generateBIB');
const { sendRegistrationConfirmation } = require('../utils/emailService');
const QRCode = require('qrcode');

// @desc    Register new participant
// @route   POST /api/participants
// @access  Public
exports.register = async (req, res) => {
  try {
    const { category, fullName, email, phone, birthDate, gender, identityNumber, shirtSize } = req.body;
    
    // Get active race
    const race = await Race.findOne();
    if (!race || !race.registrationOpen) {
      return res.status(400).json({ message: 'Pendaftaran sedang ditutup' });
    }
    
    // Check category
    const catIndex = race.categories.findIndex(c => c.id === category);
    if (catIndex === -1) {
      return res.status(400).json({ message: 'Kategori tidak valid' });
    }
    
    const catData = race.categories[catIndex];
    if (catData.registered >= catData.quota) {
      return res.status(400).json({ message: 'Kuota kategori ini sudah penuh' });
    }
    
    // Check early bird
    const isEarlyBird = race.isEarlyBirdActive();
    const basePrice = isEarlyBird ? catData.earlyBirdPrice : catData.price;
    const adminFee = 10000;
    const totalPrice = basePrice + adminFee;
    
    // Generate BIB
    const bib = await generateBIB(category, isEarlyBird);
    
    // Generate QR Code
    const qrData = JSON.stringify({ bib, category, isEarlyBird });
    const qrCode = await QRCode.toDataURL(qrData);
    
    // Create participant
    const participant = await Participant.create({
      fullName,
      email,
      phone,
      birthDate,
      gender,
      identityNumber,
      category,
      shirtSize,
      bib,
      qrCode,
      isEarlyBird,
      originalPrice: catData.price,
      discountApplied: isEarlyBird ? (catData.price - catData.earlyBirdPrice) : 0,
      payment: {
        amount: totalPrice,
        basePrice: basePrice,
        adminFee: adminFee
      },
      status: 'pending',
      registrationDate: new Date()
    });
    
    // Update race quota
    race.categories[catIndex].registered += 1;
    
    // Update early bird quota if applicable
    if (isEarlyBird) {
      race.earlyBird.currentQuota += 1;
    }
    
    await race.save();
    
    // Send email
    sendRegistrationConfirmation(participant, isEarlyBird).catch(console.error);
    
    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        bib: participant.bib,
        fullName: participant.fullName,
        category: participant.category,
        isEarlyBird: participant.isEarlyBird,
        originalPrice: participant.originalPrice,
        discountApplied: participant.discountApplied,
        basePrice: basePrice,
        adminFee: adminFee,
        totalPrice: totalPrice,
        status: participant.status,
        qrCode: participant.qrCode,
        earlyBirdMessage: isEarlyBird ? 'Selamat! Anda mendapat harga Early Bird!' : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get early bird status
// @route   GET /api/participants/earlybird-status
// @access  Public
exports.getEarlyBirdStatus = async (req, res) => {
  try {
    const race = await Race.findOne();
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    
    const isActive = race.isEarlyBirdActive();
    const remainingQuota = race.earlyBird.maxQuota - race.earlyBird.currentQuota;
    const remainingDays = Math.ceil((race.earlyBird.endDate - new Date()) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      data: {
        isActive,
        discountPercent: race.earlyBird.discountPercent,
        remainingQuota: Math.max(0, remainingQuota),
        remainingDays: Math.max(0, remainingDays),
        endDate: race.earlyBird.endDate,
        currentQuota: race.earlyBird.currentQuota,
        maxQuota: race.earlyBird.maxQuota
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (keep other existing methods: getAll, getOne, search, updatePayment, updateRacePack, delete, getStats)