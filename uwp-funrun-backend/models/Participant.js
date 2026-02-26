const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  bib: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: [true, 'Nama lengkap wajib diisi'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi'],
    trim: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  identityNumber: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['5k', '10k'], // Updated categories
    required: true
  },
  shirtSize: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    required: true
  },
  // Early Bird fields
  isEarlyBird: {
    type: Boolean,
    default: false
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  payment: {
    method: String,
    basePrice: Number, // Harga setelah diskon (jika early bird)
    adminFee: Number,
    amount: Number, // Total
    paidAt: Date,
    transactionId: String,
    proofImage: String
  },
  racePack: {
    collected: {
      type: Boolean,
      default: false
    },
    collectedAt: Date,
    collectedBy: String
  },
  qrCode: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
participantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for age calculation
participantSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for search
participantSchema.index({ bib: 1, email: 1, fullName: 'text' });

module.exports = mongoose.model('Participant', participantSchema);