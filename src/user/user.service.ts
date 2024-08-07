import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LogInUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private model: Model<User>,
  private jwtService: JwtService,
) { }
  async create(createUserDto: CreateUserDto) {
    const data = await this.model.find({ email: createUserDto.email });
    const regex: RegExp =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7}$/;

    const isValid: boolean = regex.test(createUserDto.password);
    if (data.length > 0) {
      console.log(data);

      throw new HttpException('Email Already Exist', HttpStatus.BAD_REQUEST);
    }

    if (isValid) {
      throw new HttpException(
        'Password Must Be greater or equal to 8 characters',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createUser = await this.model.create({ ...createUserDto, password: hashedPassword })

    return createUser
  }

  async login(logInDto: LogInUserDto, res: Response) {
    console.log(logInDto);
    
    const data = await this.model.findOne({ email: logInDto.email });

    console.log(data);
    

    if (!data) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }


    const match = await bcrypt.compare(logInDto.password, data.password)

    if (!match) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const token = await this.jwtService.sign({email: data.email})

    res.cookie('accessToken', token, {
      expires: new Date(Date.now() + 3600000), // 1 hour
      sameSite: 'strict',
      httpOnly: true,
    });

    console.log(token);
    

    res.status(201)

    res.send({
      token: token
    })
    

  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
