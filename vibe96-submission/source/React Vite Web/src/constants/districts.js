export const DISTRICTS_BY_DIVISION = {
  Dhaka: [
    'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj',
    'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi',
    'Rajbari', 'Shariatpur', 'Tangail',
  ],
  Chittagong: [
    'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chittagong', 'Comilla',
    "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali',
    'Rangamati',
  ],
  Rajshahi: [
    'Bogra', 'Chapai Nawabganj', 'Joypurhat', 'Naogaon', 'Natore',
    'Pabna', 'Rajshahi', 'Sirajganj',
  ],
  Khulna: [
    'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna',
    'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
  ],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
  Barisal: ['Barguna', 'Barisal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  Rangpur: [
    'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari',
    'Panchagarh', 'Rangpur', 'Thakurgaon',
  ],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
};

export const ALL_DISTRICTS = Object.values(DISTRICTS_BY_DIVISION).flat().sort();

export const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'Paperfly', 'Sundarban', 'Other'];

export const SOURCES = ['Facebook', 'Instagram', 'WhatsApp', 'Other'];

export const PAYMENT_METHODS = ['COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid in Advance'];

export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'];
