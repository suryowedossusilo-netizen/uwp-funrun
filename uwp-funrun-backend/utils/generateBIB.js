const Participant = require('../models/Participant');

const generateBIB = async (category, isEarlyBird = false) => {
  try {
    // Prefix: E = Early Bird, U = Umum/Reguler
    // Category: 5 = 5K, 10 = 10K
    const prefix = isEarlyBird ? 'E' : 'U';
    const catCode = category === '10k' ? '10' : '05';
    const year = new Date().getFullYear().toString().substr(-2);
    
    // Find last BIB with this pattern
    const pattern = new RegExp(`^${prefix}${year}${catCode}`);
    const lastParticipant = await Participant.findOne({
      bib: pattern
    }).sort({ bib: -1 });
    
    let sequence = 1;
    if (lastParticipant) {
      const lastSequence = parseInt(lastParticipant.bib.slice(-3));
      sequence = lastSequence + 1;
    }
    
    const bibNumber = sequence.toString().padStart(3, '0');
    return `${prefix}${year}${catCode}${bibNumber}`;
  } catch (error) {
    throw new Error('Error generating BIB: ' + error.message);
  }
};

module.exports = generateBIB;