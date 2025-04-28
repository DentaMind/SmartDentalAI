# Relationships
user = relationship("User", back_populates="patient")
cases = relationship("Case", back_populates="patient")
prescriptions = relationship("Prescription", back_populates="patient") 