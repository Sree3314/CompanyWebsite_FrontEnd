import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  hover = false;
  // Image paths - Make sure these images are in your Angular project's 'src/assets/' folder
  image1 = "assets/cts_ctrl.jpg"; // Your main hero image

  // Service images (same as before) - These are for the main page cards
  serviceImage1 = "https://plus.unsplash.com/premium_photo-1661666635660-e82a315fb13d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGJhbmtpbmd8ZW58MHx8MHx8fDA%3D";
  serviceImage2 = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGVhbHRoY2FyZXxlbnwwfHwwfHx8MA%3D%3D";
  serviceImage3 = "https://plus.unsplash.com/premium_photo-1681426728047-2164a00fe3dc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cmV0YWlsJTIwZ29vZHN8ZW58MHx8MHx8fDA%3D";
  serviceImage4 = "https://images.unsplash.com/photo-1455165814004-1126a7199f9b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG1hbnVmYWN0dXJpbmd8ZW58MHx8MHx8fDA%3D";

  // --- Modal Properties ---
  showModal: boolean = false;
  modalTitle: string = '';
  modalDescription: string = '';
  modalImage: string = ''; // This will be the NEW image for the popup

  // Data for services (extended content and modal-specific images)
  servicesData = [
    {
      title: "Banking and Financial Services",
      description: "Company Hub excels in providing robust, secure, and scalable digital solutions for the banking and financial sector. Our services include core banking modernization, fraud detection systems, regulatory compliance solutions (e.g., AML, KYC), payment gateway integrations, and data analytics for risk management and personalized customer services. We help institutions adopt AI/ML for predictive analytics, automate back-office operations, and enhance their cybersecurity posture. Our goal is to empower financial entities to innovate faster, improve operational efficiency, and deliver superior customer experiences in a highly regulated and competitive environment.",
      image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmFua2luZ3xlbnwwfHwwfHx8MA%3D%3D" // Specific image for modal
    },
    {
      title: "Healthcare",
      description: "In the healthcare domain, Company Hub delivers transformative digital solutions that enhance patient care, streamline clinical workflows, and improve administrative efficiency. Our offerings include custom Electronic Health Record (EHR) and Electronic Medical Record (EMR) system development, secure telehealth platforms, patient engagement portals, and advanced analytics for population health management and disease prediction. We also specialize in implementing interoperability solutions, ensuring data exchange between various healthcare systems while strictly adhering to HIPAA and other regulatory standards. Our focus is on leveraging technology to create a more integrated, efficient, and patient-centric healthcare ecosystem.",
      image: "https://plus.unsplash.com/premium_photo-1699387204388-120141c76d51?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGhlYWx0aGNhcmV8ZW58MHx8MHx8fDA%3D"
    },
    {
      title: "Retail and Consumer Goods",
      description: "Company Hub assists retail and consumer goods businesses in thriving within a dynamic market by offering cutting-edge digital solutions. Our expertise covers developing robust e-commerce platforms, implementing AI-driven personalization engines, optimizing supply chain management with real-time tracking, and deploying CRM systems for enhanced customer engagement. We also focus on integrating in-store digital experiences, inventory optimization, and advanced analytics for demand forecasting. Our solutions enable retailers to offer seamless omnichannel experiences, increase customer loyalty, and drive sales growth by understanding and responding to consumer behavior effectively.",
      image: "https://images.unsplash.com/photo-1714942179079-4fddb552d41d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHJldGFpbGVyJTIwY29uc3VtZXIlMjBnb29kc3xlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Manufacturing",
      description: "Empowering manufacturing businesses to increase efficiency, improve product quality, and embrace Industry 4.0 technologies. Our services include IoT integration, automation, and enterprise resource planning to drive operational excellence. We specialize in developing smart factory solutions, predictive maintenance systems, and robust supply chain optimization tools that enhance productivity, reduce costs, and accelerate time-to-market for complex products.",
      image: "https://images.unsplash.com/photo-1598302936625-6075fbd98dd7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hbnVmYWN0dXJpbmd8ZW58MHx8MHx8fDA%3D"
    }
  ];

  // Data for achievements (extended content and modal-specific images)
  achievementsData = [
    {
      title: "Successful Client Engagements",
      description: "Our commitment to client success is paramount. We have a track record of consistently delivering projects on time and within budget, exceeding client expectations. Our post-implementation support ensures long-term value, leading to high client retention rates and numerous successful case studies across various industries. We measure success not just by project completion, but by the tangible business outcomes our solutions enable for our partners.",
      image: "https://plus.unsplash.com/premium_photo-1661526208291-9bbe4f26efd2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fFN1Y2Nlc3NmdWwlMjBDbGllbnQlMjBFbmdhZ2VtZW50c3xlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Industry Recognition",
      description: "Company Hub has been consistently recognized by prominent industry analysts and prestigious awards for our innovative solutions and significant contributions to technology consulting. This recognition validates our expertise, thought leadership, and the impact we create for our clients. We are proud to be acknowledged as a leader in digital transformation, cloud services, and specialized industry solutions, reflecting our continuous pursuit of excellence.",
      image: "https://plus.unsplash.com/premium_photo-1712336662117-ec50f92f85ab?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8SW5kdXN0cnklMjBSZWNvZ25pdGlvbnxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Talent Development",
      description: "We believe our greatest asset is our people. Company Hub invests heavily in talent development programs, offering continuous learning opportunities, certifications, and mentorship initiatives. This commitment ensures our teams are equipped with the latest technologies and methodologies, fostering an environment of innovation and growth. Our robust talent pipeline is key to delivering high-quality solutions and maintaining a competitive edge.",
      image: "https://images.unsplash.com/photo-1632910121591-29e2484c0259?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VGFsZW50JTIwRGV2ZWxvcG1lbnQlMjBjb21wdXRlciUyMHNjaWVuZWNlfGVufDB8fDB8fHww"
    },
    {
      title: "Commitment to Excellence",
      description: "Excellence is embedded in our DNA. We adhere to rigorous quality standards and best practices across all our projects, from initial strategy to final implementation and beyond. Our commitment to continuous improvement, transparent communication, and client-centric solutions ensures that we not only meet but consistently exceed expectations, building strong, lasting partnerships based on trust and mutual success.",
      image: "https://images.unsplash.com/photo-1698653223590-a81513f95f4f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Q29tbWl0bWVudCUyMHRvJTIwRXhjZWxsZW5jZXxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Global Expansion",
      description: "In our journey of growth, Company Hub has successfully expanded its operations into new international markets, establishing a stronger global presence. This strategic expansion allows us to serve a broader client base, tap into diverse talent pools, and offer localized expertise while maintaining our global standards of service delivery. Our expansion is driven by a commitment to bringing our innovative solutions to businesses worldwide.",
      image: "https://plus.unsplash.com/premium_photo-1677675594637-e65af4d6b0e2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8R2xvYmFsJTIwRXhwYW5zaW9ufGVufDB8fDB8fHww"
    },
    {
      title: "Sustainable Practices",
      description: "Company Hub is deeply committed to environmental responsibility and sustainable business practices. We have implemented initiatives across our operations to reduce our carbon footprint, optimize energy consumption, and promote eco-friendly policies. Our efforts include transitioning to renewable energy sources, minimizing waste, and encouraging sustainable practices within our supply chain, contributing positively to a greener future.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U3VzdGFpbmFibGUlMjBQcmFjdGljZXN8ZW58MHx8MHx8fDA%3D"
    }
  ];

  // --- Modal Methods ---
  openModal(item: { title: string; description: string; image: string }) {
    this.modalTitle = item.title;
    this.modalDescription = item.description;
    this.modalImage = item.image;
    this.showModal = true;
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
  }

  closeModal() {
    this.showModal = false;
    document.body.style.overflow = ''; // Re-enable scrolling of background
  }

  // Convenience methods for services and achievements
  openServiceModal(index: number) {
    if (this.servicesData[index - 1]) { // Adjust for 0-based array
      this.openModal(this.servicesData[index - 1]);
    }
  }

  openAchievementModal(index: number) {
    if (this.achievementsData[index - 1]) { // Adjust for 0-based array
      this.openModal(this.achievementsData[index - 1]);
    }
  }
}
// 