import { MEMBERSHIP_AMOUNT } from '../../core/constants.js';
import { ErrorFactory } from '../../core/errors.js';

/**
 * Membership Pricing Strategy Pattern:
 * Encapsulates tier-specific pricing and order options.
 */

export class SilverMembershipStrategy {
  constructor() {
    this.tier = 'silver';
    this.amountInr = MEMBERSHIP_AMOUNT.silver;
  }

  buildOrderOptions(userDetails = {}) {
    const receipt = `receipt_${Date.now()}`;
    return {
      amount: this.amountInr * 100, // paise
      currency: 'INR',
      receipt,
      notes: {
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        membershipType: this.tier,
      },
    };
  }
}

export class GoldMembershipStrategy {
  constructor() {
    this.tier = 'gold';
    this.amountInr = MEMBERSHIP_AMOUNT.gold;
  }

  buildOrderOptions(userDetails = {}) {
    const receipt = `receipt_${Date.now()}`;
    return {
      amount: this.amountInr * 100, // paise
      currency: 'INR',
      receipt,
      notes: {
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        membershipType: this.tier,
      },
    };
  }
}

/**
 * MembershipPlanStrategyFactory — Factory Pattern for resolving membership pricing strategies.
 */
export class MembershipPlanStrategyFactory {
  static strategies = {
    silver: new SilverMembershipStrategy(),
    gold: new GoldMembershipStrategy(),
  };

  static getStrategy(membershipType) {
    const strategy = this.strategies[membershipType];
    if (!strategy) {
      throw ErrorFactory.badRequest('Invalid membership type');
    }
    return strategy;
  }
}
